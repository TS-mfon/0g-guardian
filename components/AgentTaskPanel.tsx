"use client";

import { FormEvent, useState } from "react";
import { ethers } from "ethers";
import { agentMetadataSchema, agentMemorySchema, taskPromptSchema } from "@shared/index";
import { clientConfig } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
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
      setStatus("Task paid. Running 0G Compute workflow...");

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
      const computeResponse = await fetch("/api/compute/run-agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ metadata, prompt: payload, model: clientConfig.computeModel })
      });
      if (!computeResponse.ok) throw new Error(await computeResponse.text());
      const compute = await computeResponse.json();
      const resultPayload = {
        version: "1.0",
        taskId: taskId.toString(),
        agentId,
        requester: address,
        response: compute.response,
        computeProvider: compute.provider,
        computeModel: compute.model,
        computeHash: compute.computeHash,
        memoryRootBefore: promptRoot,
        memoryRootAfter: hashJson({ prompt, response: compute.response, at: new Date().toISOString() }),
        createdAt: new Date().toISOString()
      };
      const memoryPayload = agentMemorySchema.parse({
        version: "1.0",
        agentId,
        memoryIndex: Number(taskId),
        previousMemoryRoot: promptRoot,
        longTermSummary: `Task ${taskId.toString()} completed. ${String(compute.response).slice(0, 180)}`,
        userPreferences: {},
        learnedFacts: [String(compute.response).slice(0, 240)],
        taskHistory: [{ taskId: taskId.toString(), promptHash: promptRoot, resultHash: hashJson(resultPayload) }],
        updatedAt: new Date().toISOString()
      });

      setStatus("Uploading result and memory proof material...");
      const resultUpload = await uploadJsonTo0GFromBrowser(resultPayload, signer);
      const memoryUpload = await uploadJsonTo0GFromBrowser(memoryPayload, signer);
      const resultRoot = resultUpload.rootHash;
      const memoryRoot = memoryUpload.rootHash;

      const daResponse = await fetch("/api/da/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ app: "agent.fun", eventType: "task", agentId, taskId: taskId.toString(), resultRoot, computeHash: compute.computeHash })
      });
      if (!daResponse.ok) throw new Error(await daResponse.text());
      const da = await daResponse.json();
      setStatus("Signing completeTask transaction with result root and DA commitment...");
      const completeTx = await contract.completeTask(
        taskId,
        bytes32(resultRoot),
        compute.computeHash,
        da.commitment,
        bytes32(memoryRoot)
      );
      await completeTx.wait();
      setStatus(`Task completed on-chain. Create tx ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}. Complete tx ${completeTx.hash.slice(0, 10)}...${completeTx.hash.slice(-6)}.`);
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
