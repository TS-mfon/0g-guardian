"use client";

import { FormEvent, useMemo, useState } from "react";
import { ethers } from "ethers";
import { AgentCategory, agentMetadataSchema, agentMemorySchema } from "@shared/index";
import { genesisTemplates } from "@/lib/agent-templates";
import { clientConfig } from "@/lib/config";
import { hashJson } from "@/lib/hash";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, agentIdContract, connectWallet } from "@/lib/wallet";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

export function LaunchAgentForm() {
  const [templateName, setTemplateName] = useState(genesisTemplates[0].name);
  const template = useMemo(() => genesisTemplates.find((item) => item.name === templateName) ?? genesisTemplates[0], [templateName]);
  const [name, setName] = useState(template.name);
  const [symbol, setSymbol] = useState(template.symbol);
  const [category, setCategory] = useState<AgentCategory>(template.category);
  const [description, setDescription] = useState(template.description);
  const [systemPrompt, setSystemPrompt] = useState(template.systemPrompt);
  const [agentIdTokenId, setAgentIdTokenId] = useState("1001");
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState("");
  const [roots, setRoots] = useState({ metadataRoot: "", memoryRoot: "", capabilityHash: "" });
  const [busy, setBusy] = useState(false);

  function loadTemplate(value: string) {
    const next = genesisTemplates.find((item) => item.name === value) ?? genesisTemplates[0];
    setTemplateName(value);
    setName(next.name);
    setSymbol(next.symbol);
    setCategory(next.category);
    setDescription(next.description);
    setSystemPrompt(next.systemPrompt);
  }

  async function launch(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Connecting wallet...");
    setTxHash("");
    try {
      if (!clientConfig.agentFunCoreAddress) throw new Error("NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS is not configured.");
      const { signer, address } = await connectWallet();
      const now = new Date().toISOString();
      const metadata = agentMetadataSchema.parse({
        version: "1.0",
        app: "agent.fun",
        name,
        symbol,
        description,
        category,
        creator: address,
        agentIdTokenId,
        avatar: { prompt: template.avatarPrompt },
        systemPrompt,
        model: { provider: "0G Compute", modelId: clientConfig.computeModel, teeRequired: category === "trading" },
        pricing: { minTaskFee: "0.0005", chatFee: "0.0005", creatorFeeBps: 300 },
        createdAt: now
      });
      const memory = agentMemorySchema.parse({
        version: "1.0",
        agentId: agentIdTokenId,
        memoryIndex: 0,
        longTermSummary: `Initial memory for ${name}.`,
        userPreferences: {},
        learnedFacts: [description],
        taskHistory: [],
        updatedAt: now
      });

      setStatus("Uploading metadata and memory to 0G Storage...");
      let metadataRoot = hashJson(metadata);
      let memoryRoot = hashJson(memory);
      try {
        const metadataUpload = await uploadJsonTo0GFromBrowser(metadata, signer);
        const memoryUpload = await uploadJsonTo0GFromBrowser(memory, signer);
        metadataRoot = metadataUpload.rootHash;
        memoryRoot = memoryUpload.rootHash;
      } catch (error) {
        setStatus(`0G Storage upload fallback hash mode: ${error instanceof Error ? error.message : String(error)}`);
      }
      const capabilityHash = hashJson({ category, systemPrompt, model: clientConfig.computeModel });
      setRoots({ metadataRoot, memoryRoot, capabilityHash });

      let finalAgentIdTokenId = BigInt(agentIdTokenId);
      if (clientConfig.agentIdContractAddress) {
        setStatus("Minting Agent ID token...");
        try {
          const idContract = await agentIdContract();
          const nextTokenId = await idContract.nextTokenId();
          const mintTx = await idContract.mint(address, metadataRoot, bytes32(metadataRoot));
          await mintTx.wait();
          finalAgentIdTokenId = BigInt(nextTokenId);
          setAgentIdTokenId(nextTokenId.toString());
        } catch (error) {
          setStatus(`Agent ID adapter skipped: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      setStatus("Signing launchAgent transaction on 0G Chain...");
      const contract = await agentFunCoreContract();
      const launchFee = await contract.launchFee();
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
      setStatus("Agent launched. It will appear in the marketplace after the next refresh.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="launch-grid">
      <form className="glass-card launch-form" onSubmit={launch}>
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
            <select value={category} onChange={(event) => setCategory(event.target.value as AgentCategory)}>
              {["chat", "research", "trading", "social", "game", "developer", "custom"].map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label>Agent ID token id<input value={agentIdTokenId} onChange={(event) => setAgentIdTokenId(event.target.value)} /></label>
        </div>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>System prompt<textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} /></label>
        <button className="primary-button" disabled={busy}>{busy ? "Launching..." : "Upload + Sign Launch"}</button>
        {status ? <p className="status-line">{status}</p> : null}
      </form>
      <aside className="glass-card launch-preview">
        <span className="section-kicker">Launch preview</span>
        <h2>{name || "New Agent"} <em>${symbol || "AGENT"}</em></h2>
        <p>{description}</p>
        <div className="agent-orb">{symbol.slice(0, 2).toUpperCase()}</div>
        <div className="launch-rail">
          <PreviewStep index="01" title="Metadata package" detail="Profile, pricing, model config, and avatar prompt." value={roots.metadataRoot} />
          <PreviewStep index="02" title="Persistent memory" detail="Initial long-context memory snapshot for this agent." value={roots.memoryRoot} />
          <PreviewStep index="03" title="Capability hash" detail="Verifiable hash of category, model, and system behavior." value={roots.capabilityHash} />
          <PreviewStep index="04" title="0G Chain launch" detail="Wallet-signed transaction that registers the agent." value={txHash} />
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
        {value ? <code>{value}</code> : <em>Generated during launch</em>}
      </div>
    </div>
  );
}
