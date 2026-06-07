"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { AgentCategory, agentFunCoreAbi, agenticIdAbi, agentMetadataSchema, agentMemorySchema } from "@shared/index";
import { AgentAvatar } from "@/components/AgentAvatar";
import { genesisTemplates } from "@/lib/agent-templates";
import { agentCategories, computeModelMatrix, computeModelsByCategory, findComputeModel, getDefaultComputeModel, isModelAllowedForCategory } from "@/lib/compute-models";
import { getZeroGNetwork, ZeroGNetworkKey } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { hashJson, shortHash } from "@/lib/hash";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { getSelectedNetworkKey, getSignerForAction, verifySelectedNetworkContracts } from "@/lib/wallet";

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
  const [readiness, setReadiness] = useState<"checking" | "ready" | "blocked">("checking");
  const [availableModels, setAvailableModels] = useState<Set<string>>(new Set());
  const network = getZeroGNetwork(networkKey);
  const selectedModel = findComputeModel(category, selectedModelId);
  const canLaunch = Boolean(name.trim() && symbol.trim() && description.trim() && systemPrompt.trim() && selectedModelId) && !busy;

  useEffect(() => {
    setNetworkKey(getSelectedNetworkKey());
    const onNetwork = () => setNetworkKey(getSelectedNetworkKey());
    window.addEventListener("agentfun:network", onNetwork);
    return () => window.removeEventListener("agentfun:network", onNetwork);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function preflight() {
      setReadiness("checking");
      try {
        const [readyResponse, modelsResponse] = await Promise.all([
          fetch(`/api/readiness?network=${networkKey}`),
          fetch(`/api/models?network=${networkKey}`)
        ]);
        const readyBody = await readyResponse.json().catch(() => ({}));
        const modelsBody = await modelsResponse.json().catch(() => ({}));
        if (cancelled) return;
        // Treat "contracts configured + RPC live" as ready, even if storage indexer is temporarily down
        const checks = readyBody.checks ?? {};
        const contractsReady = checks.rpc && checks.core && checks.agentId;
        setReadiness(contractsReady || (readyResponse.ok && readyBody.ready) ? "ready" : "blocked");
        const modelIds = (modelsBody.models ?? []).map((model: { id: string }) => model.id);
        // Never leave available models empty - fall back to the full static list so UI isn't stuck
        setAvailableModels(modelIds.length > 0 ? new Set(modelIds) : new Set(computeModelMatrix.map(({ model }) => model.id)));
      } catch {
        if (!cancelled) {
          // On preflight failure, stay ready so the user can attempt launch - actual errors surface inline
          setReadiness("ready");
          setAvailableModels(new Set(computeModelMatrix.map(({ model }) => model.id)));
        }
      }
    }
    void preflight();
    return () => { cancelled = true; };
  }, [networkKey]);

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
      if (readiness === "blocked") throw new Error(`${network.label} launch contracts are not configured. Switch to a network with deployed contracts.`);
      setStatus("Connecting wallet...");
      const { provider, signer, address } = await getSignerForAction();
      setStatus("Verifying contracts on chain...");
      const selectedNetwork = await verifySelectedNetworkContracts(provider);
      setNetworkKey(selectedNetwork.key);
      if (!isModelAllowedForCategory(category, selectedModelId)) {
        throw new Error("Choose a 0G Compute model that supports this agent task type.");
      }
      const idContract = new ethers.Contract(selectedNetwork.agentIdContractAddress, agenticIdAbi, signer);
      const contract = new ethers.Contract(selectedNetwork.agentFunCoreAddress, agentFunCoreAbi, signer);
      const [nextTokenId, launchFee, nextAgentId] = await Promise.all([
        idContract.nextTokenId(),
        contract.launchFee(),
        contract.nextAgentId()
      ]);
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
      const [metadataUpload, memoryUpload] = await Promise.all([
        uploadJsonTo0GFromBrowser(metadata, signer, selectedNetwork.key),
        uploadJsonTo0GFromBrowser(memory, signer, selectedNetwork.key)
      ]);
      const metadataRoot = metadataUpload.rootHash;
      const memoryRoot = memoryUpload.rootHash;
      const capabilityHash = hashJson({ category, systemPrompt, model: selectedModel.id, tier: selectedModel.tier, teeRequired: selectedModel.teeRequired });

      setStatus("Minting Agent ID token...");
      const mintTx = await idContract.mint(address, metadataRoot, bytes32(metadataRoot));
      await mintTx.wait();
      const finalAgentIdTokenId = BigInt(nextTokenId);
      setAgentIdTokenId(nextTokenIdText);

      setStatus("Signing launchAgent transaction on 0G Chain...");
      const tx = await contract.launchAgent(
        name,
        symbol.toUpperCase(),
        category,
        finalAgentIdTokenId,
        bytes32(metadataRoot),
        bytes32(memoryRoot),
        capabilityHash,
        selectedModel.id,
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
      const msg = getUserMessage(error, "");
      setStatus(msg || (error instanceof Error ? error.message : "Launch failed. Please retry."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="launch-grid">
      <form className="glass-card launch-form" onSubmit={launch}>
        <div className="network-readiness-card">
          <span className="status-badge pending">{network.label}</span>
          <strong>{readiness === "ready" ? "Network ready" : readiness === "checking" ? "Checking live services..." : "Launch contracts not configured for this network"}</strong>
          <p>
            {readiness === "blocked"
              ? `${network.label} launch contracts are not deployed or configured yet. Switch network or check environment setup.`
              : "Launches verify live contracts, upload metadata to 0G Storage, then register the agent on-chain."}
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
        <label>Identity mode<input value="Mint new Agent ID during launch" readOnly /></label>
        <div className="model-select-row">
          <label>
            Category
            <select value={category} onChange={(event) => changeCategory(event.target.value as AgentCategory)}>
              {agentCategories.map((item) => <option key={item} value={item}>{item.charAt(0).toUpperCase() + item.slice(1)}</option>)}
            </select>
          </label>
          <label>
            0G Compute model
            <select value={selectedModelId} onChange={(event) => setSelectedModelId(event.target.value)}>
              {computeModelsByCategory[category].map((model) => (
                <option value={model.id} key={model.id}>
                  {model.label} · {model.tier}{model.teeRequired ? " · TEE" : ""}
                </option>
              ))}
            </select>
          </label>
        </div>
        <p className="model-hint">{selectedModel.reason}{selectedModel.teeRequired ? " Runs in a trusted execution environment." : ""}</p>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>System prompt<textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} /></label>
        <button className="primary-button" disabled={!canLaunch || readiness === "blocked"}>{busy ? "Launching..." : "Launch verified agent"}</button>
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
