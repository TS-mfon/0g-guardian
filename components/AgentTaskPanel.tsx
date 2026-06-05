"use client";

import { FormEvent, useState } from "react";
import { ethers } from "ethers";
import { agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { AgentView } from "@/lib/agentfun";
import { clientConfig } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, connectWallet, getSelectedNetworkKey } from "@/lib/wallet";
import { TaskResultReceipt, TaskResultReceiptData } from "./TaskResultReceipt";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

export function AgentTaskPanel({ agent }: { agent: AgentView }) {
  const [prompt, setPrompt] = useState(`Ask ${agent.name} to complete a useful task.`);
  const [status, setStatus] = useState("");
  const [taskTx, setTaskTx] = useState("");
  const [receipt, setReceipt] = useState<TaskResultReceiptData | null>(null);
  const [busy, setBusy] = useState(false);
  const canCreateTask = Boolean(prompt.trim()) && agent.active && !busy;

  async function createTask(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setReceipt(null);
    setStatus("Checking agent execution readiness...");
    try {
      const readiness = await fetch(`/api/agents/compute-key?agentId=${encodeURIComponent(agent.id)}`);
      const readinessBody = await readiness.json().catch(() => null);
      if (!readiness.ok || !readinessBody?.configured) {
        throw new Error("The creator has not linked a 0G Compute key for this agent yet.");
      }
      const activeModel = String(readinessBody.model ?? clientConfig.computeModel);

      setStatus("Connecting wallet...");
      const { signer, address } = await connectWallet();
      const payload = taskPromptSchema.parse({
        version: "1.0",
        agentId: agent.id,
        requester: address,
        prompt,
        createdAt: new Date().toISOString()
      });
      setStatus("Uploading task prompt to 0G Storage...");
      const upload = await uploadJsonTo0GFromBrowser(payload, signer, getSelectedNetworkKey());
      const promptRoot = upload.rootHash;
      const contract = await agentFunCoreContract();
      const fee = await contract.minTaskFee();
      const taskId = await contract.nextTaskId();
      setStatus("Signing paid task transaction...");
      const tx = await contract.createTask(BigInt(agent.id), bytes32(promptRoot), { value: fee });
      setTaskTx(tx.hash);
      await tx.wait();
      setStatus("Task paid. Sending it to the verified executor...");

      const metadata = agentMetadataSchema.parse({
        version: "1.0",
        app: "agent.fun",
        name: agent.name,
        symbol: agent.symbol,
        description: `${agent.name} task execution profile.`,
        category: agent.category,
        creator: agent.creator,
        agentIdTokenId: agent.agentIdTokenId,
        avatar: { prompt: `${agent.name} AI agent` },
        systemPrompt: `You are ${agent.name}, an autonomous 0G agent. Complete paid tasks clearly and concisely.`,
        model: { provider: "0G Compute", modelId: activeModel, teeRequired: agent.category === "trading" },
        pricing: { minTaskFee: "0.0005", chatFee: "0.0005", creatorFeeBps: 300 },
        createdAt: new Date().toISOString()
      });
      const executeResponse = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId: taskId.toString(), metadata, prompt: payload, model: activeModel })
      });
      if (!executeResponse.ok) {
        const body = await executeResponse.json().catch(() => null);
        const message = body?.error?.message ?? "Task is paid but execution is pending. Retry later or refund after the deadline.";
        throw new Error(message);
      }
      const execution = await executeResponse.json();
      setReceipt({
        taskId: String(execution.taskId),
        answer: String(execution.answer ?? ""),
        model: String(execution.model ?? activeModel),
        provider: String(execution.provider ?? "0G Compute"),
        resultRoot: String(execution.resultRoot),
        memoryRoot: String(execution.memoryRoot),
        computeHash: String(execution.computeHash),
        daCommitment: String(execution.daCommitment),
        runningTx: execution.runningTx ? String(execution.runningTx) : undefined,
        completionTx: String(execution.completionTx)
      });
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
      <h2>Hire {agent.name}</h2>
      <p className="task-readiness-copy">
        The app checks creator compute activation before asking your wallet for payment.
      </p>
      <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <button className="primary-button" disabled={!canCreateTask}>{busy ? "Creating task..." : agent.active ? "Pay + Create Task" : "Agent paused"}</button>
      {status ? <p className="status-line">{status}</p> : null}
      {taskTx ? <a className="proof-link" href={`${clientConfig.explorerUrl}/tx/${taskTx}`} target="_blank" rel="noreferrer">View task transaction</a> : null}
      {receipt ? <TaskResultReceipt receipt={receipt} /> : null}
    </form>
  );
}
