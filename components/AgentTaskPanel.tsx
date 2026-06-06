"use client";

import { FormEvent, useState } from "react";
import { ethers } from "ethers";
import { taskPromptSchema } from "@shared/index";
import { AgentView } from "@/lib/agentfun";
import { getZeroGNetwork } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, getSelectedNetworkKey, getSignerForAction } from "@/lib/wallet";
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
  const canCreateTask = Boolean(prompt.trim()) && agent.active && agent.computeActive && !busy;

  async function createTask(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setReceipt(null);
    setStatus("Checking agent execution readiness...");
    try {
      const selectedNetwork = getSelectedNetworkKey();
      if (!agent.computeActive) throw new Error("The creator has not activated compute for this agent yet.");
      const readinessResponse = await fetch(`/api/readiness?network=${selectedNetwork}`);
      const readiness = await readinessResponse.json().catch(() => null);
      if (!readinessResponse.ok || !readiness?.taskReady) {
        throw new Error("The selected network execution service is not ready. No payment was requested.");
      }
      const quoteResponse = await fetch("/api/task-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ network: selectedNetwork, model: agent.modelId })
      });
      const quote = await quoteResponse.json().catch(() => null);
      if (!quoteResponse.ok || !quote?.computeBudget) throw new Error(quote?.error?.message ?? "Live compute pricing is unavailable.");

      setStatus("Connecting wallet...");
      const { signer, address } = await getSignerForAction();
      const payload = taskPromptSchema.parse({
        version: "1.0",
        agentId: agent.id,
        requester: address,
        prompt,
        createdAt: new Date().toISOString()
      });
      setStatus("Uploading task prompt to 0G Storage...");
      const upload = await uploadJsonTo0GFromBrowser(payload, signer, selectedNetwork);
      const promptRoot = upload.rootHash;
      const contract = await agentFunCoreContract();
      const [fee, taskId] = await Promise.all([contract.minTaskFee(), contract.nextTaskId()]);
      const computeBudget = BigInt(quote.computeBudget);
      const total = fee + computeBudget;
      setStatus("Signing paid task transaction...");
      const tx = await contract.createTask(BigInt(agent.id), bytes32(promptRoot), computeBudget, BigInt(Math.floor(Date.now() / 1000) + 86_400), { value: total });
      setTaskTx(tx.hash);
      await tx.wait();
      setStatus("Task paid. Sending it to the verified executor...");

      const executeResponse = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId: taskId.toString(), prompt: payload, network: selectedNetwork })
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
        model: String(execution.model ?? agent.modelId),
        provider: String(execution.provider ?? "0G Compute"),
        resultRoot: String(execution.resultRoot),
        memoryRoot: String(execution.memoryRoot),
        computeHash: String(execution.computeHash),
        computeCost: String(execution.computeCost ?? ""),
        runningTx: execution.runningTx ? String(execution.runningTx) : undefined,
        completionTx: String(execution.completionTx)
      });
      setStatus(`Task completed by the verified executor. Create tx ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}. Complete tx ${execution.completionTx.slice(0, 10)}...${execution.completionTx.slice(-6)}.`);
    } catch (error) {
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
      <button className="primary-button" disabled={!canCreateTask}>{busy ? "Creating task..." : !agent.active ? "Agent paused" : !agent.computeActive ? "Creator activation required" : "Pay + Create Task"}</button>
      {status ? <p className="status-line">{status}</p> : null}
      {taskTx ? <a className="proof-link" href={`${getZeroGNetwork(getSelectedNetworkKey()).explorerUrl}/tx/${taskTx}`} target="_blank" rel="noreferrer">View task transaction</a> : null}
      {receipt ? <TaskResultReceipt receipt={receipt} /> : null}
    </form>
  );
}
