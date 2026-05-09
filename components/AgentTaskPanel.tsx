"use client";

import { FormEvent, useState } from "react";
import { ethers } from "ethers";
import { agentMetadataSchema, agentMemorySchema, taskPromptSchema } from "@shared/index";
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
      let resultRoot = hashJson(resultPayload);
      let memoryRoot = hashJson(memoryPayload);
      try {
        const resultUpload = await uploadJsonTo0GFromBrowser(resultPayload, signer);
        const memoryUpload = await uploadJsonTo0GFromBrowser(memoryPayload, signer);
        resultRoot = resultUpload.rootHash;
        memoryRoot = memoryUpload.rootHash;
      } catch {
        // Keep deterministic roots when browser storage upload is unavailable.
      }

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
      setStatus(`Task completed on-chain. Create tx ${tx.hash}. Complete tx ${completeTx.hash}`);
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
