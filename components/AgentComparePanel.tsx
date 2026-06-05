"use client";

import { FormEvent, useMemo, useState } from "react";
import { ethers } from "ethers";
import { agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { TaskResultReceipt, TaskResultReceiptData } from "@/components/TaskResultReceipt";
import { AgentView } from "@/lib/agentfun";
import { clientConfig } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import { uploadJsonTo0GFromBrowser } from "@/lib/storage-client";
import { agentFunCoreContract, connectWallet, getSelectedNetworkKey } from "@/lib/wallet";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

export function AgentComparePanel({ agents }: { agents: AgentView[] }) {
  const liveAgents = useMemo(() => agents.filter((agent) => agent.active), [agents]);
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

  async function ensureReady(agent: AgentView) {
    const response = await fetch(`/api/agents/compute-key?agentId=${encodeURIComponent(agent.id)}&network=${encodeURIComponent(getSelectedNetworkKey())}`);
    const body = await response.json().catch(() => null);
    if (!response.ok || !body?.configured) {
      throw new Error(`${agent.name} is not ready for paid tasks because the creator has not activated 0G Compute.`);
    }
    return String(body.model ?? clientConfig.computeModel);
  }

  async function runOne(agent: AgentView, signer: ethers.Signer, requester: string) {
    const activeModel = await ensureReady(agent);
    const payload = taskPromptSchema.parse({
      version: "1.0",
      agentId: agent.id,
      requester,
      prompt,
      createdAt: new Date().toISOString()
    });
    setStatus(`Uploading ${agent.name}'s comparison prompt to 0G Storage...`);
    const upload = await uploadJsonTo0GFromBrowser(payload, signer, getSelectedNetworkKey());
    const contract = await agentFunCoreContract();
    const fee = await contract.minTaskFee();
    const taskId = await contract.nextTaskId();
    setStatus(`Sign paid task transaction for ${agent.name}.`);
    const tx = await contract.createTask(BigInt(agent.id), bytes32(upload.rootHash), { value: fee });
    await tx.wait();

    setStatus(`Executing ${agent.name} through the verified task pipeline...`);
    const metadata = agentMetadataSchema.parse({
      version: "1.0",
      app: "agent.fun",
      name: agent.name,
      symbol: agent.symbol,
      description: `${agent.name} comparison execution profile.`,
      category: agent.category,
      creator: agent.creator,
      agentIdTokenId: agent.agentIdTokenId,
      avatar: { prompt: `${agent.name} AI agent` },
      systemPrompt: `You are ${agent.name}, an autonomous 0G agent. Complete comparison tasks clearly and concisely.`,
      model: { provider: "0G Compute", modelId: activeModel, teeRequired: agent.category === "trading" },
      pricing: { minTaskFee: "0.0005", chatFee: "0.0005", creatorFeeBps: 300 },
      createdAt: new Date().toISOString()
    });
    const executeResponse = await fetch("/api/tasks/execute", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ taskId: taskId.toString(), metadata, prompt: payload, model: activeModel, network: getSelectedNetworkKey() })
    });
    const execution = await executeResponse.json().catch(() => null);
    if (!executeResponse.ok) {
      throw new Error(execution?.error?.message ?? `${agent.name} task is paid but execution is pending.`);
    }
    return {
      taskId: String(execution.taskId),
      answer: String(execution.answer ?? ""),
      model: String(execution.model ?? activeModel),
      provider: String(execution.provider ?? "0G Compute"),
      resultRoot: String(execution.resultRoot),
      memoryRoot: String(execution.memoryRoot),
      computeHash: String(execution.computeHash),
      daCommitment: String(execution.daCommitment),
      daStatus: execution.daStatus === "attached" ? "attached" : "not_attached",
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
      const { signer, address } = await connectWallet();
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

  if (liveAgents.length < 2) return null;

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
      {status ? <p className="status-line">{status}</p> : null}
      <div className="compare-results-grid">
        {resultA ? <TaskResultReceipt receipt={resultA} /> : null}
        {resultB ? <TaskResultReceipt receipt={resultB} /> : null}
      </div>
    </form>
  );
}
