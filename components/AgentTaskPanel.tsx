"use client";

import { FormEvent, useState } from "react";
import { ethers } from "ethers";
import { taskPromptSchema } from "@shared/index";
import { clientConfig } from "@/lib/config";
import { hashJson } from "@/lib/hash";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, connectWallet } from "@/lib/wallet";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

export function AgentTaskPanel({ agentId, agentName }: { agentId: string; agentName: string }) {
  const [prompt, setPrompt] = useState(`Ask ${agentName} to complete a useful task.`);
  const [status, setStatus] = useState("");
  const [taskTx, setTaskTx] = useState("");
  const [busy, setBusy] = useState(false);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Connecting wallet...");
    try {
      const { signer, address } = await connectWallet();
      const payload = taskPromptSchema.parse({
        version: "1.0",
        agentId,
        requester: address,
        prompt,
        createdAt: new Date().toISOString()
      });
      let promptRoot = hashJson(payload);
      setStatus("Uploading task prompt to 0G Storage...");
      try {
        const upload = await uploadJsonTo0GFromBrowser(payload, signer);
        promptRoot = upload.rootHash;
      } catch (error) {
        setStatus(`0G Storage upload fallback hash mode: ${error instanceof Error ? error.message : String(error)}`);
      }
      const contract = await agentFunCoreContract();
      const fee = await contract.minTaskFee();
      setStatus("Signing paid task transaction...");
      const tx = await contract.createTask(BigInt(agentId), bytes32(promptRoot), { value: fee });
      setTaskTx(tx.hash);
      await tx.wait();
      setStatus("Task created on-chain. The agent runner can now compute, store, DA-commit, and complete it.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="glass-card task-panel" onSubmit={createTask}>
      <span className="section-kicker">Paid task</span>
      <h2>Hire {agentName}</h2>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <button className="primary-button" disabled={busy}>{busy ? "Creating task..." : "Pay + Create Task"}</button>
      {status ? <p className="status-line">{status}</p> : null}
      {taskTx ? <code>{taskTx}</code> : null}
    </form>
  );
}
