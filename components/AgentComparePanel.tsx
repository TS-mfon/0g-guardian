"use client";

import { FormEvent, useMemo, useState } from "react";
import { ethers } from "ethers";
import { taskPromptSchema } from "@shared/index";
import { TaskResultReceipt, TaskResultReceiptData } from "@/components/TaskResultReceipt";
import { AgentView } from "@/lib/agentfun";
import { getUserMessage } from "@/lib/errors";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, getSelectedNetworkKey, getSignerForAction } from "@/lib/wallet";
import { failedReadinessMessage, getCreatedTaskId } from "@/lib/task-client";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

export function AgentComparePanel({ agents }: { agents: AgentView[] }) {
  const liveAgents = useMemo(() => agents.filter((agent) => agent.active && agent.computeActive), [agents]);
  const [agentA, setAgentA] = useState(liveAgents[0]?.id ?? "");
  const [agentB, setAgentB] = useState(liveAgents[1]?.id ?? liveAgents[0]?.id ?? "");
  const [prompt, setPrompt] = useState("Compare both agents on a useful task and return the strongest practical answer.");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [resultA, setResultA] = useState<TaskResultReceiptData | null>(null);
  const [resultB, setResultB] = useState<TaskResultReceiptData | null>(null);
  const selectedA = liveAgents.find((agent) => agent.id === agentA);
  const selectedB = liveAgents.find((agent) => agent.id === agentB);
  const canCompare = Boolean(selectedA && selectedB && selectedA.id !== selectedB.id && prompt.trim()) && !busy;

  async function runOne(agent: AgentView, signer: ethers.Signer, requester: string) {
    if (!agent.computeActive) throw new Error(`${agent.name} is not ready because the creator has not activated compute.`);
    const network = getSelectedNetworkKey();
    const readinessResponse = await fetch(`/api/readiness?network=${network}`);
    const readiness = await readinessResponse.json().catch(() => null);
    if (!readinessResponse.ok || !readiness?.taskReady) throw new Error(`${agent.name}: ${failedReadinessMessage(readiness)}`);
    const quoteResponse = await fetch("/api/task-quote", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ network, model: agent.modelId })
    });
    const quote = await quoteResponse.json().catch(() => null);
    if (!quoteResponse.ok || !quote?.computeBudget) throw new Error(quote?.error?.message ?? `Could not price ${agent.name}.`);
    const payload = taskPromptSchema.parse({
      version: "1.0",
      agentId: agent.id,
      requester,
      prompt,
      createdAt: new Date().toISOString()
    });
    setStatus(`Uploading ${agent.name}'s comparison prompt to 0G Storage...`);
    const upload = await uploadJsonTo0GFromBrowser(payload, signer, network);
    const contract = await agentFunCoreContract();
    const fee = await contract.minTaskFee();
    const computeBudget = BigInt(quote.computeBudget);
    setStatus(`Sign paid task transaction for ${agent.name}.`);
    const tx = await contract.createTask(BigInt(agent.id), bytes32(upload.rootHash), computeBudget, BigInt(Math.floor(Date.now() / 1000) + 86_400), { value: fee + computeBudget });
    const taskId = getCreatedTaskId(await tx.wait());

    setStatus(`Executing ${agent.name} through the verified task pipeline...`);
    const executeResponse = await fetch("/api/tasks/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ taskId, network })
    });
    const execution = await executeResponse.json().catch(() => null);
    if (!executeResponse.ok) {
      throw new Error(execution?.error?.message ?? `${agent.name} task is paid but execution is pending.`);
    }
    if (!execution?.completionTx) throw new Error(`${agent.name} task is paid and execution is ${execution?.status ?? "pending"}. Recover it from the task center.`);
    return {
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
    } satisfies TaskResultReceiptData;
  }

  async function compare(event: FormEvent) {
    event.preventDefault();
    if (!selectedA || !selectedB) return;
    setBusy(true);
    setResultA(null);
    setResultB(null);
    setStatus("Connecting wallet for comparison tasks...");
    try {
      const { signer, address } = await getSignerForAction();
      const first = await runOne(selectedA, signer, address);
      setResultA(first);
      const second = await runOne(selectedB, signer, address);
      setResultB(second);
      setStatus("Both agents completed the comparison task. Review the outputs side by side.");
    } catch (error) {
      setStatus(getUserMessage(error, "Comparison failed. Any paid task may remain pending for retry."));
    } finally {
      setBusy(false);
    }
  }

  if (liveAgents.length < 2) {
    return (
      <section className="glass-card compare-panel">
        <span className="section-kicker">Compare lab</span>
        <h2>Two execution-ready agents required</h2>
        <p>Comparison becomes available after at least two creators activate compute for their agents.</p>
      </section>
    );
  }

  return (
    <form className="glass-card compare-panel" onSubmit={compare}>
      <span className="section-kicker">Compare lab</span>
      <h2>Run one task against two live agents</h2>
      <p>Compare uses the same paid task pipeline as agent pages: wallet payment, 0G Storage prompt root, 0G Compute execution, result storage, and on-chain completion.</p>
      <div className="two-col">
        <label>
          Agent A
          <select value={agentA} onChange={(event) => setAgentA(event.target.value)}>
            {liveAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.category}</option>)}
          </select>
        </label>
        <label>
          Agent B
          <select value={agentB} onChange={(event) => setAgentB(event.target.value)}>
            {liveAgents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name} · {agent.category}</option>)}
          </select>
        </label>
      </div>
      <label>Comparison task<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} /></label>
      <button className="primary-button" disabled={!canCompare}>{busy ? "Running comparison..." : "Pay + run comparison"}</button>
      {status ? <p className="status-line" aria-live="polite">{status}</p> : null}
      <div className="compare-results-grid">
        {resultA ? <TaskResultReceipt receipt={resultA} /> : null}
        {resultB ? <TaskResultReceipt receipt={resultB} /> : null}
      </div>
    </form>
  );
}
