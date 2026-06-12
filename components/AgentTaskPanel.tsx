"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { taskPromptSchema } from "@shared/index";
import { AgentView } from "@/lib/agentfun";
import { getZeroGNetwork } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, getSelectedNetworkKey, getSignerForAction } from "@/lib/wallet";
import { TaskResultReceipt, TaskResultReceiptData } from "./TaskResultReceipt";
import { failedReadinessMessage, getCreatedTaskId } from "@/lib/task-client";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

export function AgentTaskPanel({ agent }: { agent: AgentView }) {
  const [prompt, setPrompt] = useState(`Ask ${agent.name} to complete a useful task.`);
  const [status, setStatus] = useState("");
  const [taskTx, setTaskTx] = useState("");
  const [receipt, setReceipt] = useState<TaskResultReceiptData | null>(null);
  const [busy, setBusy] = useState(false);
  const [readiness, setReadiness] = useState<{ taskReady: boolean; checkedAt?: string; lastSuccessfulCheckAt?: string | null; checks?: Record<string, { ok: boolean; message: string }> } | null>(null);
  const [quote, setQuote] = useState<{ computeBudget: string; computeBudgetFormatted: string; taskFee: string; total: string; storageCost: string } | null>(null);
  const canCreateTask = Boolean(prompt.trim()) && agent.active && agent.computeActive && readiness?.taskReady && quote && !busy;

  const refreshReadiness = useCallback(async () => {
    setStatus("Checking execution readiness...");
    const [readyResponse, quoteResponse] = await Promise.all([
      fetch("/api/readiness", { cache: "no-store" }),
      fetch("/api/task-quote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ model: agent.modelId })
      })
    ]);
    const [readyBody, quoteBody] = await Promise.all([readyResponse.json().catch(() => null), quoteResponse.json().catch(() => null)]);
    setReadiness(readyBody);
    setQuote(quoteResponse.ok ? quoteBody : null);
    setStatus(readyBody?.taskReady ? "Execution is ready. Payment remains in your wallet until you submit." : failedReadinessMessage(readyBody));
  }, [agent.modelId]);

  useEffect(() => {
    void refreshReadiness();
  }, [refreshReadiness]);

  async function createTask(event: FormEvent) {
    event.preventDefault();
    let paidTxHash = "";
    setBusy(true);
    setReceipt(null);
    setStatus("Checking agent execution readiness...");
    try {
      const selectedNetwork = getSelectedNetworkKey();
      if (!agent.computeActive) throw new Error("The creator has not activated compute for this agent yet.");
      const readinessResponse = await fetch(`/api/readiness?network=${selectedNetwork}`, { cache: "no-store" });
      const readiness = await readinessResponse.json().catch(() => null);
      if (!readinessResponse.ok || !readiness?.taskReady) {
        throw new Error(failedReadinessMessage(readiness));
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
      const fee = await contract.minTaskFee();
      const computeBudget = BigInt(quote.computeBudget);
      const total = fee + computeBudget;
      setStatus("Signing paid task transaction...");
      const tx = await contract.createTask(BigInt(agent.id), bytes32(promptRoot), computeBudget, BigInt(Math.floor(Date.now() / 1000) + 86_400), { value: total });
      paidTxHash = tx.hash;
      setTaskTx(tx.hash);
      const taskId = getCreatedTaskId(await tx.wait());
      setStatus(`Task paid; execution pending. Task #${taskId} can be retried from the task center.`);

      const executeResponse = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId, network: selectedNetwork })
      });
      if (!executeResponse.ok) {
        const body = await executeResponse.json().catch(() => null);
        const message = body?.error?.message ?? "Task is paid but execution is pending. Retry later or refund after the deadline.";
        throw new Error(message);
      }
      const execution = await executeResponse.json();
      if (!execution.completionTx) {
        setStatus(`Task paid; execution ${execution.status ?? "pending"}. Open task #${taskId} in the task center for recovery.`);
        return;
      }
      setReceipt({
        taskId: String(execution.taskId ?? taskId),
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
      setStatus(paidTxHash
        ? getUserMessage(error, "Task paid; execution pending. Open the task center to retry or claim a refund after the deadline.")
        : getUserMessage(error, "Task preparation stopped before payment. No payment was requested."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="glass-card task-panel" onSubmit={createTask}>
      <span className="section-kicker">Paid task</span>
      <h2>Hire {agent.name}</h2>
      <p className="task-readiness-copy">Payment is blocked until RPC, Storage, Router funding, executor authorization, executor gas, and a live model provider are verified.</p>
      <label htmlFor={`task-prompt-${agent.id}`}>Task instructions</label>
      <textarea id={`task-prompt-${agent.id}`} value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      {quote ? <div className="task-quote"><span>Task fee: {quote.taskFee} 0G</span><span>Maximum compute: {quote.computeBudgetFormatted} 0G</span><span>Storage: {quote.storageCost}</span><strong>Task escrow total: {quote.total} 0G</strong></div> : null}
      <button className="primary-button" disabled={!canCreateTask}>{busy ? "Creating task..." : !agent.active ? "Agent paused" : !agent.computeActive ? "Creator activation required" : !readiness?.taskReady ? "Execution unavailable" : "Pay + Create Task"}</button>
      <button className="secondary-button" type="button" disabled={busy} onClick={() => void refreshReadiness()}>Retry readiness</button>
      {readiness?.checkedAt ? <p className="task-readiness-copy">Last checked {new Date(readiness.checkedAt).toLocaleTimeString()}. Last fully ready {readiness.lastSuccessfulCheckAt ? new Date(readiness.lastSuccessfulCheckAt).toLocaleTimeString() : "not yet"}.</p> : null}
      {status ? <p className="status-line" aria-live="polite">{status}</p> : null}
      {taskTx ? <a className="proof-link" href={`${getZeroGNetwork(getSelectedNetworkKey()).explorerUrl}/tx/${taskTx}`} target="_blank" rel="noreferrer">View task transaction</a> : null}
      {taskTx ? <a className="proof-link" href="/tasks">Open task center</a> : null}
      {receipt ? <TaskResultReceipt receipt={receipt} /> : null}
    </form>
  );
}
