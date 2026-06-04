"use client";

import { FormEvent, useState } from "react";
import { ethers } from "ethers";
import { agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { clientConfig } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
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
      setStatus("Uploading task prompt to 0G Storage...");
      const upload = await uploadJsonTo0GFromBrowser(payload, signer);
      const promptRoot = upload.rootHash;
      const contract = await agentFunCoreContract();
      const fee = await contract.minTaskFee();
      const taskId = await contract.nextTaskId();
      setStatus("Signing paid task transaction...");
      const tx = await contract.createTask(BigInt(agentId), bytes32(promptRoot), { value: fee });
      setTaskTx(tx.hash);
      await tx.wait();
      setStatus("Task paid. Sending it to the verified executor...");

      const metadata = agentMetadataSchema.parse({
        version: "1.0",
        app: "agent.fun",
        name: agentName,
        symbol: agentName.slice(0, 5).toUpperCase(),
        description: `${agentName} task execution profile.`,
        category: "custom",
        creator: address,
        agentIdTokenId: agentId,
        avatar: { prompt: `${agentName} AI agent` },
        systemPrompt: `You are ${agentName}, an autonomous 0G agent. Complete paid tasks clearly and concisely.`,
        model: { provider: "0G Compute", modelId: clientConfig.computeModel, teeRequired: false },
        pricing: { minTaskFee: "0.0005", chatFee: "0.0005", creatorFeeBps: 300 },
        createdAt: new Date().toISOString()
      });
      const executeResponse = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId: taskId.toString(), metadata, prompt: payload, model: clientConfig.computeModel })
      });
      if (!executeResponse.ok) throw new Error(await executeResponse.text());
      const execution = await executeResponse.json();
      setStatus(`Task completed by the verified executor. Create tx ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}. Complete tx ${execution.completionTx.slice(0, 10)}...${execution.completionTx.slice(-6)}.`);
    } catch (error) {
      setTaskTx("");
      setStatus(getUserMessage(error, "Task failed. Please retry."));
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
      {taskTx ? <a className="proof-link" href={`${clientConfig.explorerUrl}/tx/${taskTx}`} target="_blank" rel="noreferrer">View task transaction</a> : null}
    </form>
  );
}
