"use client";

import { FormEvent, useEffect, useState } from "react";
import { ethers } from "ethers";
import { clientConfig } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { connectWallet, getCurrentWalletAddressSilently } from "@/lib/wallet";

function linkMessage(input: { agentId: string; creator: string }) {
  return [
    "Agent.fun creator compute link",
    `Agent ID: ${String(BigInt(input.agentId))}`,
    `Creator: ${input.creator.toLowerCase()}`,
    "I authorize this server to use my 0G Compute key only for paid tasks on this agent."
  ].join("\n");
}

export function CreatorComputeKeyPanel({ agentId, creator }: { agentId: string; creator: string }) {
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState("Checking creator compute setup...");
  const [configured, setConfigured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  async function refreshStatus() {
    const response = await fetch(`/api/agents/compute-key?agentId=${encodeURIComponent(agentId)}`);
    const body = await response.json();
    if (body.configured) {
      setConfigured(true);
      setStatus(`0G Compute linked for ${body.model}.`);
    } else {
      setConfigured(false);
      setStatus("Creator must link a real 0G Compute key before paid tasks can execute.");
    }
  }

  useEffect(() => {
    async function hydrateRole() {
      const address = await getCurrentWalletAddressSilently();
      const creatorWallet = Boolean(address) && address.toLowerCase() === creator.toLowerCase();
      setIsCreator(creatorWallet);
      if (creatorWallet) await refreshStatus();
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

      setStatus("Preparing 0G Compute provider...");
      const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      const broker = await createZGComputeNetworkBroker(signer);
      const providerAddress = clientConfig.directComputeProvider;

      setStatus("Checking creator compute ledger...");
      try {
        await broker.ledger.getLedger();
      } catch {
        setStatus("Creating 0G Compute ledger. Sign the 3 0G deposit transaction.");
        await broker.ledger.addLedger(3);
      }

      setStatus("Funding provider account. Sign the 1 0G transfer transaction.");
      try {
        await broker.inference.getAccount(providerAddress);
      } catch {
        await broker.ledger.transferFund(providerAddress, "inference", ethers.parseEther("1"));
      }

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
          apiKey: generatedKey,
          signer: address,
          signature,
          provider: `0G Direct Provider ${providerAddress}`,
          baseUrl: `${metadata.endpoint.replace(/\/$/, "")}/v1/proxy`,
          model: metadata.model
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

  if (!isCreator) return null;

  return (
    <form className="glass-card compute-key-panel creator-console-panel" onSubmit={saveKey}>
      <span className="section-kicker">Creator console</span>
      <h2>{configured ? "Task execution is active" : "Activate task execution"}</h2>
      <p>
        Your creator wallet funds the 0G Compute account used by this agent. Users only see whether the agent is ready for paid tasks.
      </p>
      <div className="compute-route">
        <span>Provider</span>
        <strong>{clientConfig.directComputeProvider}</strong>
      </div>
      <div className="compute-route">
        <span>Model</span>
        <strong>{clientConfig.computeModel}</strong>
      </div>
      <div className="compute-route">
        <span>Creator payment</span>
        <strong>3 0G ledger + 1 0G provider balance</strong>
      </div>
      <button className="primary-button" disabled={busy}>
        {busy ? "Activating..." : configured ? "Refresh compute funding" : "Activate compute with 0G"}
      </button>
      {status ? <p className="status-line">{status}</p> : null}
      <a className="proof-link" href="https://compute-marketplace.0g.ai/" target="_blank" rel="noreferrer">
        View 0G Compute marketplace
      </a>
    </form>
  );
}
