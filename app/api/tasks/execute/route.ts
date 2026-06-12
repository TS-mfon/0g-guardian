import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { agentMemorySchema, agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { apiError, readJson } from "@/lib/api";
import { getZeroGNetwork, isAddressConfigured } from "@/lib/config";
import { calculateActualComputeCost, getLiveComputePrice } from "@/lib/compute-pricing";
import { hashJson } from "@/lib/hash";
import { runAgentTask } from "@/lib/compute-client";
import { downloadJsonFrom0G, uploadBytesTo0GFromServer } from "@/lib/storage-server";
import { enforceRateLimit } from "@/lib/api-security";
import { getExecutorContract, getExecutorWallet } from "@/lib/executor";
import { quoteComputeBudget } from "@/lib/compute-pricing";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

async function uploadJson(payload: unknown) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  return uploadBytesTo0GFromServer(encoded);
}

const executingTasks = new Set<string>();

export async function POST(request: Request) {
  let lockedTaskKey = "";
  try {
    enforceRateLimit(request, "task-execute", 6);
    const body = await readJson(request, 96_000);
    const network = getZeroGNetwork();
    if (!isAddressConfigured(network.agentFunCoreAddress)) {
      return NextResponse.json({ error: { code: "CONTRACT_NOT_CONFIGURED", message: "Agent.fun contract is not configured." } }, { status: 500 });
    }

    const taskId = BigInt(String(body.taskId ?? "0"));
    if (taskId === 0n) {
      return NextResponse.json({ error: { code: "INVALID_TASK", message: "A valid task ID is required." } }, { status: 400 });
    }

    const taskKey = taskId.toString();
    if (executingTasks.has(taskKey)) {
      return NextResponse.json({ taskId: taskKey, status: "executing", message: "Execution is already in progress." }, { status: 202 });
    }
    const wallet = getExecutorWallet();
    const contract = getExecutorContract();
    const task = await contract.getTask(taskId);
    const agent = await contract.getAgent(task.agentId);
    const status = Number(task.status);
    if (status === 3) {
      return NextResponse.json({
        taskId: taskKey,
        status: "completed",
        resultRoot: String(task.resultRoot),
        computeHash: String(task.computeHash),
        computeCost: task.actualComputeCost.toString()
      });
    }
    if (status !== 1 && status !== 2) {
      return NextResponse.json({ error: { code: "TASK_NOT_OPEN", message: "This task is not open for execution." } }, { status: 409 });
    }
    if (status === 2 && body.retry !== true) {
      return NextResponse.json({ taskId: taskKey, status: "executing", message: "This task is already marked running. Use an explicit retry from the task center if execution stalled." }, { status: 202 });
    }
    if (!(await contract.taskExecutors(wallet.address))) {
      return NextResponse.json({ error: { code: "EXECUTOR_UNAUTHORIZED", message: "The configured executor is not authorized." } }, { status: 503 });
    }
    if (BigInt(task.deadline) <= BigInt(Math.floor(Date.now() / 1000))) {
      return NextResponse.json({ error: { code: "TASK_EXPIRED", message: "This task has expired and can be refunded." } }, { status: 409 });
    }
    const prompt = taskPromptSchema.parse(await downloadJsonFrom0G(String(task.promptRoot)));
    if (task.requester.toLowerCase() !== prompt.requester.toLowerCase()) {
      return NextResponse.json({ error: { code: "REQUESTER_MISMATCH", message: "Task requester does not match the paid task." } }, { status: 400 });
    }
    if (task.agentId.toString() !== prompt.agentId) {
      return NextResponse.json({ error: { code: "AGENT_MISMATCH", message: "Task agent does not match the paid task." } }, { status: 400 });
    }
    if (BigInt(task.fee) <= 0n) {
      return NextResponse.json({ error: { code: "TASK_UNPAID", message: "This task has no escrowed payment." } }, { status: 402 });
    }

    const committedPromptRoot = String(task.promptRoot).toLowerCase();
    if (!/^0x[a-f0-9]{64}$/.test(committedPromptRoot)) {
      return NextResponse.json({ error: { code: "INVALID_PROMPT_ROOT", message: "The paid task does not contain a valid prompt root." } }, { status: 400 });
    }

    executingTasks.add(taskKey);
    lockedTaskKey = taskKey;
    const metadata = agentMetadataSchema.parse(await downloadJsonFrom0G(String(agent.metadataRoot)));
    if (metadata.creator.toLowerCase() !== String(agent.creator).toLowerCase()) {
      throw new Error("Stored metadata creator does not match the on-chain agent.");
    }
    if (metadata.model.modelId !== String(agent.modelId)) {
      throw new Error("Stored metadata model does not match the on-chain agent.");
    }
    const price = await getLiveComputePrice(String(agent.modelId));
    if (quoteComputeBudget(price) > BigInt(task.computeBudget)) {
      return NextResponse.json({ error: { code: "BUDGET_TOO_LOW", message: "Current Router pricing no longer fits the paid compute budget. Refund after the deadline." } }, { status: 409 });
    }
    let runningTxHash = "";
    if (status === 1) {
      const runningTx = await contract.markTaskRunning(taskId);
      runningTxHash = runningTx.hash;
      await runningTx.wait();
    }
    const apiKey = process.env.OG_COMPUTE_KEY;
    const baseUrl = process.env.OG_COMPUTE_BASE_URL;
    const result = await runAgentTask({
      metadata,
      prompt,
      model: String(agent.modelId),
      apiKey,
      baseUrl
    });
    const computeHash = hashJson(result);
    const resultPayload = {
      version: "1.0",
      taskId: taskId.toString(),
      agentId: prompt.agentId,
      requester: prompt.requester,
      response: result.response,
      computeProvider: result.provider,
      computeModel: result.model,
      computeHash,
      memoryRootBefore: String(agent.memoryRoot),
      memoryRootAfter: hashJson({ prompt: prompt.prompt, response: result.response, at: new Date().toISOString() }),
      createdAt: new Date().toISOString()
    };
    const memoryPayload = agentMemorySchema.parse({
      version: "1.0",
      agentId: prompt.agentId,
      memoryIndex: Number(taskId),
      previousMemoryRoot: String(agent.memoryRoot),
      longTermSummary: `Task ${taskId.toString()} completed. ${result.response.slice(0, 180)}`,
      userPreferences: {},
      learnedFacts: [result.response.slice(0, 240)],
      taskHistory: [{ taskId: taskId.toString(), promptHash: String(task.promptRoot), resultHash: hashJson(resultPayload) }],
      updatedAt: new Date().toISOString()
    });

    const [resultUpload, memoryUpload] = await Promise.all([uploadJson(resultPayload), uploadJson(memoryPayload)]);
    const actualComputeCost = calculateActualComputeCost(price, result.usage, BigInt(task.computeBudget));

    const tx = await contract.completeTask(taskId, bytes32(resultUpload.rootHash), computeHash, bytes32(memoryUpload.rootHash), actualComputeCost);
    await tx.wait();
    return NextResponse.json({
      taskId: taskId.toString(),
      answer: result.response,
      model: result.model,
      provider: result.provider,
      resultRoot: resultUpload.rootHash,
      memoryRoot: memoryUpload.rootHash,
      computeHash,
      computeCost: actualComputeCost.toString(),
      runningTx: runningTxHash,
      completionTx: tx.hash
    });
  } catch (error) {
    return apiError(error, "Task execution failed.");
  } finally {
    if (lockedTaskKey) executingTasks.delete(lockedTaskKey);
  }
}
