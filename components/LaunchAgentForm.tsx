"use client";

import { FormEvent, useMemo, useState } from "react";
import { ethers } from "ethers";
import { AgentCategory, agentMetadataSchema, agentMemorySchema } from "@shared/index";
import { genesisTemplates } from "@/lib/agent-templates";
import { clientConfig } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { hashJson, shortHash } from "@/lib/hash";
import { uploadFileTo0GFromBrowser, uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
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
  const [verifiedProof, setVerifiedProof] = useState({ agentId: "", metadataRoot: "", memoryRoot: "", capabilityHash: "", imageRoot: "", txHash: "" });
  const [agentImage, setAgentImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState("");
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

  function selectImage(file: File | null) {
    setAgentImage(file);
    setImagePreview((previous) => {
      if (previous) URL.revokeObjectURL(previous);
      return file ? URL.createObjectURL(file) : "";
    });
  }

  async function launch(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Connecting wallet...");
    setTxHash("");
    setVerifiedProof({ agentId: "", metadataRoot: "", memoryRoot: "", capabilityHash: "", imageRoot: "", txHash: "" });
    try {
      if (!clientConfig.agentFunCoreAddress) throw new Error("NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS is not configured.");
      if (!clientConfig.agentIdContractAddress) throw new Error("Agent ID contract is not configured.");
      if (!agentImage) throw new Error("Please add an agent image before launch.");
      if (agentImage.size > 5 * 1024 * 1024) throw new Error("Agent image must be 5MB or less.");
      const { signer, address } = await connectWallet();
      const idContract = await agentIdContract();
      const nextTokenId = await idContract.nextTokenId();
      const nextTokenIdText = nextTokenId.toString();
      const now = new Date().toISOString();
      setStatus("Uploading agent image to 0G Storage...");
      const imageUpload = await uploadFileTo0GFromBrowser(agentImage, signer);
      const metadata = agentMetadataSchema.parse({
        version: "1.0",
        app: "agent.fun",
        name,
        symbol,
        description,
        category,
        creator: address,
        agentIdTokenId: nextTokenIdText,
        avatar: { prompt: template.avatarPrompt, storageRoot: imageUpload.rootHash, mimeType: agentImage.type },
        systemPrompt,
        model: { provider: "0G Compute", modelId: clientConfig.computeModel, teeRequired: category === "trading" },
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
      const metadataUpload = await uploadJsonTo0GFromBrowser(metadata, signer);
      const memoryUpload = await uploadJsonTo0GFromBrowser(memory, signer);
      const metadataRoot = metadataUpload.rootHash;
      const memoryRoot = memoryUpload.rootHash;
      const capabilityHash = hashJson({ category, systemPrompt, model: clientConfig.computeModel });

      setStatus("Minting Agent ID token...");
      const mintTx = await idContract.mint(address, metadataRoot, bytes32(metadataRoot));
      await mintTx.wait();
      const finalAgentIdTokenId = BigInt(nextTokenId);
      setAgentIdTokenId(nextTokenIdText);

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
      setVerifiedProof({ agentId: nextTokenIdText, metadataRoot, memoryRoot, capabilityHash, imageRoot: imageUpload.rootHash, txHash: tx.hash });
      setStatus("Agent launched on 0G. Verified proof is ready.");
    } catch (error) {
      setTxHash("");
      setVerifiedProof({ agentId: "", metadataRoot: "", memoryRoot: "", capabilityHash: "", imageRoot: "", txHash: "" });
      setStatus(getUserMessage(error, "Launch failed. Please retry."));
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
          <label>Identity mode<input value="Mint new Agent ID during launch" readOnly /></label>
        </div>
        <label>
          Agent image
          <input
            accept="image/png,image/jpeg,image/webp"
            type="file"
            onChange={(event) => selectImage(event.target.files?.[0] ?? null)}
          />
        </label>
        <label>Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>System prompt<textarea value={systemPrompt} onChange={(event) => setSystemPrompt(event.target.value)} /></label>
        <button className="primary-button" disabled={busy}>{busy ? "Launching..." : "Launch verified agent"}</button>
        {status ? <p className="status-line">{status}</p> : null}
      </form>
      <aside className="glass-card launch-preview">
        <span className="section-kicker">Launch desk</span>
        <h2>{name || "New Agent"} <em>${symbol || "AGENT"}</em></h2>
        <p>{description}</p>
        {imagePreview ? (
          <img className="agent-image-preview" src={imagePreview} alt={`${name} preview`} />
        ) : (
          <div className="agent-orb">{symbol.slice(0, 2).toUpperCase()}</div>
        )}
        <div className="launch-rail">
          <PreviewStep index="01" title="Agent profile" detail="Name, category, pricing, and model behavior prepared for 0G Storage." value={verifiedProof.metadataRoot} />
          <PreviewStep index="02" title="Agent image" detail="Uploaded to 0G Storage and attached to the metadata package." value={verifiedProof.imageRoot} />
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
