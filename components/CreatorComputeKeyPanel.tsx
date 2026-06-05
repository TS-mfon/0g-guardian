"use client";

import { FormEvent, useEffect, useState } from "react";
import { ethers } from "ethers";
import { AgentCategory } from "@shared/index";
import { computeModelsByCategory, findComputeModel, getActivationQuote, getDefaultComputeModel, isModelAllowedForCategory } from "@/lib/compute-models";
import { clientConfig } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { agentFunCoreContract, connectWallet, getCurrentWalletAddressSilently, getSelectedNetworkKey } from "@/lib/wallet";

function linkMessage(input: { agentId: string; creator: string }) {
  return [
    "Agent.fun creator compute link",
    `Agent ID: ${String(BigInt(input.agentId))}`,
    `Creator: ${input.creator.toLowerCase()}`,
    "I authorize this server to use my 0G Compute key only for paid tasks on this agent."
  ].join("\n");
}

export function CreatorComputeKeyPanel({ agentId, creator, category = "custom" }: { agentId: string; creator: string; category?: string }) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("Checking creator compute setup...");
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [claimable, setClaimable] = useState("");
  const [isCreator, setIsCreator] = useState(false);
  const normalizedCategory = (category in computeModelsByCategory ? category : "custom") as AgentCategory;
  const [selectedModelId, setSelectedModelId] = useState(getDefaultComputeModel(normalizedCategory).id);
  const selectedModel = findComputeModel(normalizedCategory, selectedModelId);
  const activationQuote = getActivationQuote(selectedModel);

  async function refreshStatus() {
    const response = await fetch(`/api/agents/compute-key?agentId=${encodeURIComponent(agentId)}&network=${encodeURIComponent(getSelectedNetworkKey())}`);
    const body = await response.json();
    if (body.configured) {
      setConfigured(true);
      setStatus(`0G Compute linked for ${body.model}.`);
    } else {
      setConfigured(false);
      setStatus("Creator must link a real 0G Compute key before paid tasks can execute.");
    }
  }

  async function refreshClaimable() {
    try {
      const contract = await agentFunCoreContract();
      const value = await contract.claimable(creator);
      setClaimable(ethers.formatEther(value));
    } catch {
      setClaimable("");
    }
  }

  useEffect(() => {
    async function hydrateRole() {
      const address = await getCurrentWalletAddressSilently();
      const creatorWallet = Boolean(address) && address.toLowerCase() === creator.toLowerCase();
      setIsCreator(creatorWallet);
      if (creatorWallet) {
        await Promise.all([refreshStatus(), refreshClaimable()]);
      }
    }
    void hydrateRole().catch(() => setIsCreator(false));
    const onWallet = () => void hydrateRole().catch(() => setIsCreator(false));
    window.addEventListener("agentfun:wallet", onWallet);
    return () => window.removeEventListener("agentfun:wallet", onWallet);
  }, []);

  async function saveKey(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Connecting creator wallet...");
    try {
      const { signer, address } = await connectWallet();
      if (address.toLowerCase() !== creator.toLowerCase()) {
        throw new Error("Only the agent creator can link this compute key.");
      }
      if (!isModelAllowedForCategory(normalizedCategory, selectedModelId)) {
        throw new Error("Choose a 0G Compute model that supports this agent task type.");
      }

      setStatus("Preparing 0G Compute provider...");
      const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      const broker = await createZGComputeNetworkBroker(signer);
      const providerAddress = clientConfig.directComputeProvider;

      setStatus("Checking creator compute ledger...");
      try {
        await broker.ledger.getLedger();
      } catch {
        setStatus(`Creating 0G Compute ledger. Sign the ${activationQuote.deposit} 0G deposit transaction.`);
        await broker.ledger.addLedger(Number(activationQuote.deposit));
      }

      setStatus(`Funding model execution balance. Sign the ${activationQuote.deposit} 0G provider transfer transaction.`);
      try {
        await broker.inference.getAccount(providerAddress);
      } catch {
        await broker.ledger.transferFund(providerAddress, "inference", ethers.parseEther(activationQuote.deposit));
      }

      setStatus(`Paying ${activationQuote.protocolFee} 0G protocol activation fee...`);
      const protocolTx = await signer.sendTransaction({
        to: clientConfig.protocolFeeWallet,
        value: ethers.parseEther(activationQuote.protocolFee)
      });
      await protocolTx.wait();

      setStatus("Acknowledging provider TEE signer...");
      await broker.inference.acknowledgeProviderSigner(providerAddress);

      const metadata = await broker.inference.getServiceMetadata(providerAddress);
      setStatus("Generating creator-paid provider token...");
      const tokenId = Number(BigInt(agentId) % 255n);
      const generated = await broker.inference.requestProcessor.createApiKey(providerAddress, {
        expiresIn: 0,
        tokenId
      });
      const generatedKey = generated.rawToken;

      const signature = await signer.signMessage(linkMessage({ agentId, creator }));
      setStatus("Encrypting and saving 0G Compute key...");
      const response = await fetch("/api/agents/compute-key", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          agentId,
          network: getSelectedNetworkKey(),
          apiKey: generatedKey,
          signer: address,
          signature,
          provider: `0G Direct Provider ${providerAddress}`,
          baseUrl: `${metadata.endpoint.replace(/\/$/, "")}/v1/proxy`,
          model: selectedModel.id
        })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message ?? "Could not save 0G Compute key.");
      setConfigured(true);
      setStatus(`0G Compute linked for ${body.model}.`);
    } catch (error) {
      setStatus(getUserMessage(error, "Could not link 0G Compute key."));
    } finally {
      setBusy(false);
    }
  }

  async function claimEarnings() {
    setBusy(true);
    setStatus("Sign wallet transaction to claim creator earnings.");
    try {
      const { address } = await connectWallet();
      if (address.toLowerCase() !== creator.toLowerCase()) {
        throw new Error("Only the agent creator can claim earnings for this agent.");
      }
      const contract = await agentFunCoreContract();
      const value = await contract.claimable(address);
      if (value === 0n) throw new Error("No claimable earnings yet.");
      const tx = await contract.claimRevenue();
      await tx.wait();
      await refreshClaimable();
      setStatus(`Creator earnings claimed. Tx ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}.`);
    } catch (error) {
      setStatus(getUserMessage(error, "Creator earnings claim failed."));
    } finally {
      setBusy(false);
    }
  }

  if (!isCreator) return null;

  return (
    <form id="creator-console" className="glass-card compute-key-panel creator-console-panel" onSubmit={saveKey}>
      <span className="section-kicker">Creator console</span>
      <h2>{configured ? "Task execution is active" : "Activate task execution"}</h2>
      <p>
        Your creator wallet funds the 0G Compute account used by this agent. Users only see whether the agent is ready for paid tasks.
      </p>
      <label>
        Compute model
        <select value={selectedModelId} onChange={(event) => setSelectedModelId(event.target.value)} disabled={busy || configured}>
          {computeModelsByCategory[normalizedCategory].map((model) => <option value={model.id} key={model.id}>{model.label} · {model.tier}</option>)}
        </select>
      </label>
      <div className="compute-route">
        <span>Provider</span>
        <strong>{clientConfig.directComputeProvider}</strong>
      </div>
      <div className="compute-route">
        <span>Model</span>
        <strong>{selectedModel.label}</strong>
      </div>
      <div className="compute-route">
        <span>Creator activation</span>
        <strong>{activationQuote.deposit} 0G compute + {activationQuote.protocolFee} 0G protocol fee</strong>
      </div>
      <div className="compute-route">
        <span>Creator earnings</span>
        <strong>{claimable ? `${claimable} 0G claimable` : "No claimable earnings yet"}</strong>
      </div>
      <button className="primary-button" disabled={busy}>
        {busy ? "Activating..." : configured ? "Refresh compute funding" : "Activate compute with 0G"}
      </button>
      <button type="button" className="secondary-button" onClick={claimEarnings} disabled={busy || !Number(claimable)}>
        {busy ? "Working..." : "Claim earnings"}
      </button>
      {status ? <p className="status-line">{status}</p> : null}
      <a className="proof-link" href="https://compute-marketplace.0g.ai/" target="_blank" rel="noreferrer">
        View 0G Compute marketplace
      </a>
    </form>
  );
}
