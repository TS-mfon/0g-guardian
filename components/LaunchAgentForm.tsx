"use client";

import { FormEvent, useMemo, useState } from "react";
import { ethers } from "ethers";
import { AgentCategory, agentMetadataSchema, agentMemorySchema } from "@shared/index";
import { genesisTemplates } from "@/lib/agent-templates";
import { clientConfig } from "@/lib/config";
import { hashJson } from "@/lib/hash";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, connectWallet } from "@/lib/wallet";

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

      setStatus("Signing launchAgent transaction on 0G Chain...");
      const contract = await agentFunCoreContract();
      const launchFee = await contract.launchFee();
      const tx = await contract.launchAgent(
        name,
        symbol.toUpperCase(),
        category,
        BigInt(agentIdTokenId),
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
        <div className="proof-lines">
          <code>metadataRoot: {roots.metadataRoot || "created on launch"}</code>
          <code>memoryRoot: {roots.memoryRoot || "created on launch"}</code>
          <code>capabilityHash: {roots.capabilityHash || "created on launch"}</code>
          <code>tx: {txHash || "wallet signature required"}</code>
        </div>
      </aside>
    </section>
  );
}
