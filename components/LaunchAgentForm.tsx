"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { AgentCategory, agentMetadataSchema, agentMemorySchema } from "@shared/index";
import { AgentAvatar } from "@/components/AgentAvatar";
import { genesisTemplates } from "@/lib/agent-templates";
import { agentCategories, computeModelMatrix, computeModelsByCategory, findComputeModel, getActivationQuote, getDefaultComputeModel, isModelAllowedForCategory } from "@/lib/compute-models";
import { getZeroGNetwork, ZeroGNetworkKey } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { hashJson, shortHash } from "@/lib/hash";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import {
  agentFunCoreContract,
  agentIdContract,
  connectWallet,
  getSelectedNetworkKey,
  verifySelectedNetworkContracts
} from "@/lib/wallet";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

export function LaunchAgentForm() {
  const [templateName, setTemplateName] = useState(genesisTemplates[0].name);
  const template = useMemo(() => genesisTemplates.find((item) => item.name === templateName) ?? genesisTemplates[0], [templateName]);
  const [name, setName] = useState(template.name);
  const [symbol, setSymbol] = useState(template.symbol);
  const [category, setCategory] = useState<AgentCategory>(template.category);
  const [selectedModelId, setSelectedModelId] = useState(getDefaultComputeModel(template.category).id);
  const [description, setDescription] = useState(template.description);
  const [systemPrompt, setSystemPrompt] = useState(template.systemPrompt);
  const [agentIdTokenId, setAgentIdTokenId] = useState("1001");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [verifiedProof, setVerifiedProof] = useState({ agentId: "", metadataRoot: "", memoryRoot: "", capabilityHash: "", txHash: "" });
  const [busy, setBusy] = useState(false);
  const [launchedAgentId, setLaunchedAgentId] = useState("");
  const [networkKey, setNetworkKey] = useState<ZeroGNetworkKey>("mainnet");
  const network = getZeroGNetwork(networkKey);
  const selectedModel = findComputeModel(category, selectedModelId);
  const activationQuote = getActivationQuote(selectedModel);
  const canLaunch = Boolean(name.trim() && symbol.trim() && description.trim() && systemPrompt.trim() && selectedModelId) && !busy;

  useEffect(() => {
    setNetworkKey(getSelectedNetworkKey());
    const onNetwork = () => setNetworkKey(getSelectedNetworkKey());
    window.addEventListener("agentfun:network", onNetwork);
    return () => window.removeEventListener("agentfun:network", onNetwork);
  }, []);

  function loadTemplate(value: string) {
    const next = genesisTemplates.find((item) => item.name === value) ?? genesisTemplates[0];
    setTemplateName(value);
    setName(next.name);
    setSymbol(next.symbol);
    setCategory(next.category);
    setSelectedModelId(getDefaultComputeModel(next.category).id);
    setDescription(next.description);
    setSystemPrompt(next.systemPrompt);
  }

  function changeCategory(value: AgentCategory) {
    setCategory(value);
    setSelectedModelId(getDefaultComputeModel(value).id);
  }

  async function launch(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Connecting wallet...");
    setTxHash("");
    setLaunchedAgentId("");
    setVerifiedProof({ agentId: "", metadataRoot: "", memoryRoot: "", capabilityHash: "", txHash: "" });
    try {
      const { provider, signer, address } = await connectWallet();
      const selectedNetwork = await verifySelectedNetworkContracts(provider);
      setNetworkKey(selectedNetwork.key);
      if (!isModelAllowedForCategory(category, selectedModelId)) {
        throw new Error("Choose a 0G Compute model that supports this agent task type.");
      }
      const idContract = await agentIdContract(selectedNetwork.key);
      const nextTokenId = await idContract.nextTokenId();
      const nextTokenIdText = nextTokenId.toString();
      const now = new Date().toISOString();
      const metadata = agentMetadataSchema.parse({
        version: "1.0",
        app: "agent.fun",
        name,
        symbol,
        description,
        category,
        creator: address,
        agentIdTokenId: nextTokenIdText,
        avatar: { prompt: template.avatarPrompt },
        systemPrompt,
        model: { provider: "0G Compute", modelId: selectedModel.id, tier: selectedModel.tier, modality: selectedModel.modality, teeRequired: Boolean(selectedModel.teeRequired || category === "trading") },
        pricing: { minTaskFee: "0.0005", chatFee: "0.0005", creatorFeeBps: 300 },
        createdAt: now
      });
      const memory = agentMemorySchema.parse({
        version: "1.0",
        agentId: nextTokenIdText,
        memoryIndex: 0,
        longTermSummary: `Initial memory for ${name}.`,
        userPreferences: {},
        learnedFacts: [description],
        taskHistory: [],
        updatedAt: now
      });

      setStatus("Uploading metadata and memory to 0G Storage...");
      const metadataUpload = await uploadJsonTo0GFromBrowser(metadata, signer, selectedNetwork.key);
      const memoryUpload = await uploadJsonTo0GFromBrowser(memory, signer, selectedNetwork.key);
      const metadataRoot = metadataUpload.rootHash;
      const memoryRoot = memoryUpload.rootHash;
      const capabilityHash = hashJson({ category, systemPrompt, model: selectedModel.id, tier: selectedModel.tier, teeRequired: selectedModel.teeRequired });

      setStatus("Minting Agent ID token...");
      const mintTx = await idContract.mint(address, metadataRoot, bytes32(metadataRoot));
      await mintTx.wait();
      const finalAgentIdTokenId = BigInt(nextTokenId);
      setAgentIdTokenId(nextTokenIdText);

      setStatus("Signing launchAgent transaction on 0G Chain...");
      const contract = await agentFunCoreContract(selectedNetwork.key);
      const launchFee = await contract.launchFee();
      const nextAgentId = await contract.nextAgentId();
      const tx = await contract.launchAgent(
        name,
        symbol.toUpperCase(),
        category,
        finalAgentIdTokenId,
        bytes32(metadataRoot),
        bytes32(memoryRoot),
        capabilityHash,
        { value: launchFee }
      );
      setTxHash(tx.hash);
      await tx.wait();
      setLaunchedAgentId(nextAgentId.toString());
      setVerifiedProof({ agentId: nextTokenIdText, metadataRoot, memoryRoot, capabilityHash, txHash: tx.hash });
      setStatus("Agent launched on 0G. Activate compute now or pay later from Creator Console.");
    } catch (error) {
      setTxHash("");
      setVerifiedProof({ agentId: "", metadataRoot: "", memoryRoot: "", capabilityHash: "", txHash: "" });
      setStatus(getUserMessage(error, "Launch failed. Please retry."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="launch-grid">
      <form className="glass-card launch-form" onSubmit={launch}>
        <div className="network-readiness-card">
          <span className="status-badge pending">{network.label}</span>
          <strong>{network.agentFunCoreAddress && network.agentIdContractAddress ? "Launch preflight enabled" : "Contracts not configured"}</strong>
          <p>
            Launches use the selected 0G network, verify live contracts, upload metadata to 0G Storage, then register the agent on-chain.
          </p>
        </div>
        <label>
          Start from a Genesis template
          <select value={templateName} onChange={(event) => loadTemplate(event.target.value)}>
            {genesisTemplates.map((item) => <option key={item.name}>{item.name}</option>)}
          </select>
        </label>
        <div className="two-col">
          <label>Agent name<input value={name} onChange={(event) => setName(event.target.value)} /></label>
          <label>Symbol<input value={symbol} onChange={(event) => setSymbol(event.target.value.toUpperCase())} /></label>
        </div>
        <div className="two-col">
          <label>
            Category
            <select value={category} onChange={(event) => changeCategory(event.target.value as AgentCategory)}>
              {agentCategories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Identity mode<input value="Mint new Agent ID during launch" readOnly /></label>
        </div>
        <label>
          0G Compute model for this task type
          <select value={selectedModelId} onChange={(event) => setSelectedModelId(event.target.value)}>
            {computeModelsByCategory[category].map((model) => <option value={model.id} key={model.id}>{model.label} · {model.tier}</option>)}
          </select>
        </label>
        <div className="model-matrix-panel">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">Model map</span>
              <h3>Pick a task type to reveal compatible 0G models</h3>
            </div>
          </div>
          <div className="model-matrix-grid">
            {computeModelMatrix.map(({ category: itemCategory, model }) => (
              <button
                type="button"
                className={itemCategory === category && model.id === selectedModel.id ? "model-option-card active" : "model-option-card"}
                key={`${itemCategory}-${model.id}`}
                onClick={() => {
                  changeCategory(itemCategory);
                  setSelectedModelId(model.id);
                }}
              >
                <span>{itemCategory}</span>
                <strong>{model.label}</strong>
                <p>{model.reason}</p>
                <em>{model.tier}{model.teeRequired ? " · TEE" : ""} · {model.modality}</em>
              </button>
            ))}
          </div>
        </div>
        <div className="network-readiness-card compute-model-card">
          <span className={selectedModel.teeRequired ? "status-badge success" : "status-badge pending"}>{selectedModel.modality}</span>
          <strong>{selectedModel.label}</strong>
          <p>{selectedModel.reason}</p>
          <p>{activationQuote.label}: {activationQuote.deposit} 0G compute deposit + {activationQuote.protocolFee} 0G protocol activation fee.</p>
        </div>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>System prompt<textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} /></label>
        <button className="primary-button" disabled={!canLaunch}>{busy ? "Launching..." : "Launch verified agent"}</button>
        {status ? <p className="status-line">{status}</p> : null}
        {launchedAgentId ? (
          <div className="post-launch-actions">
            <a className="primary-button" href={`/agents/${launchedAgentId}#creator-console`}>Activate compute now</a>
            <a className="secondary-button" href="/portfolio">Pay later in Creator Console</a>
          </div>
        ) : null}
      </form>
      <aside className="glass-card launch-preview">
        <span className="section-kicker">Launch desk</span>
        <h2>{name || "New Agent"} <em>${symbol || "AGENT"}</em></h2>
        <p>{description}</p>
        <AgentAvatar name={name || "New Agent"} category={category} size="xl" />
        <div className="launch-rail">
          <PreviewStep index="01" title="Agent profile" detail={`${selectedModel.label} selected for this agent.`} value={verifiedProof.metadataRoot} />
          <PreviewStep index="02" title="Persistent memory" detail="Initial memory package uploaded to 0G Storage." value={verifiedProof.memoryRoot} />
          <PreviewStep index="03" title="Agent ID" detail="Minted through the connected wallet before launch." value={verifiedProof.agentId ? `Agent ID #${verifiedProof.agentId}` : ""} />
          <PreviewStep index="04" title="0G Chain launch" detail="Confirmed wallet transaction registering the agent on-chain." value={verifiedProof.txHash || txHash} />
        </div>
      </aside>
    </section>
  );
}

function PreviewStep({ index, title, detail, value }: { index: string; title: string; detail: string; value: string }) {
  return (
    <div className={value ? "launch-step complete" : "launch-step"}>
      <span>{index}</span>
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
        {value ? <code>{value.startsWith("0x") ? shortHash(value) : value}</code> : <em>Visible after confirmed launch</em>}
      </div>
    </div>
  );
}
