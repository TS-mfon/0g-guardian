import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, Wallet, ethers } from "ethers";
import { agentFunCoreAbi, agentMemorySchema, agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { apiError, readJson } from "@/lib/api";
import { clientConfig } from "@/lib/config";
import { hashJson } from "@/lib/hash";
import { runAgentTask } from "@/lib/compute-client";
import { loadCreatorComputeKeyForNetwork } from "@/lib/creator-compute-store";
import { uploadBytesTo0GFromServer } from "@/lib/storage-server";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

async function uploadJson(payload: unknown) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  return uploadBytesTo0GFromServer(encoded);
}

function executorWallet() {
  const privateKey = (
    process.env.EXECUTOR_PRIVATE_KEY ??
    process.env.SERVER_WALLET_PRIVATE_KEY ??
    process.env.DEPLOYER_PRIVATE_KEY ??
    process.env.PRIVATE_KEY ??
    ""
  ).trim();
  if (!privateKey) throw new Error("EXECUTOR_PRIVATE_KEY is not configured.");
  const provider = new JsonRpcProvider(clientConfig.rpcUrl, clientConfig.chainId);
  return new Wallet(privateKey, provider);
}

export async function POST(request: Request) {
  try {
    if (!/^0x[a-fA-F0-9]{40}$/.test(clientConfig.agentFunCoreAddress)) {
      return NextResponse.json({ error: { code: "CONTRACT_NOT_CONFIGURED", message: "Agent.fun contract is not configured." } }, { status: 500 });
    }

    const body = await readJson(request, 96_000);
    const taskId = BigInt(String(body.taskId ?? "0"));
    if (taskId === 0n) {
      return NextResponse.json({ error: { code: "INVALID_TASK", message: "A valid task ID is required." } }, { status: 400 });
    }

    const metadata = agentMetadataSchema.parse(body.metadata);
    const prompt = taskPromptSchema.parse(body.prompt);
    const wallet = executorWallet();
    const contract = new Contract(clientConfig.agentFunCoreAddress, agentFunCoreAbi, wallet);
    const task = await contract.getTask(taskId);
    const status = Number(task.status);
    if (status !== 1 && status !== 2) {
      return NextResponse.json({ error: { code: "TASK_NOT_OPEN", message: "This task is not open for execution." } }, { status: 409 });
    }
    if (task.requester.toLowerCase() !== prompt.requester.toLowerCase()) {
      return NextResponse.json({ error: { code: "REQUESTER_MISMATCH", message: "Task requester does not match the paid task." } }, { status: 400 });
    }
    if (task.agentId.toString() !== prompt.agentId) {
      return NextResponse.json({ error: { code: "AGENT_MISMATCH", message: "Task agent does not match the paid task." } }, { status: 400 });
    }
    if (BigInt(task.fee) <= 0n) {
      return NextResponse.json({ error: { code: "TASK_UNPAID", message: "This task has no escrowed payment." } }, { status: 402 });
    }

    let runningTxHash = "";
    if (status === 1) {
      const runningTx = await contract.markTaskRunning(taskId);
      runningTxHash = runningTx.hash;
      await runningTx.wait();
    }

    const network = String(body.network ?? "mainnet");
    const creatorCompute = await loadCreatorComputeKeyForNetwork(prompt.agentId, network);
    const result = await runAgentTask({
      metadata,
      prompt,
      model: creatorCompute.model || String(body.model ?? clientConfig.computeModel),
      apiKey: creatorCompute.apiKey,
      baseUrl: creatorCompute.baseUrl
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
      memoryRootBefore: metadata.agentIdTokenId,
      memoryRootAfter: hashJson({ prompt: prompt.prompt, response: result.response, at: new Date().toISOString() }),
      createdAt: new Date().toISOString()
    };
    const memoryPayload = agentMemorySchema.parse({
      version: "1.0",
      agentId: prompt.agentId,
      memoryIndex: Number(taskId),
      previousMemoryRoot: String(task.promptRoot),
      longTermSummary: `Task ${taskId.toString()} completed. ${result.response.slice(0, 180)}`,
      userPreferences: {},
      learnedFacts: [result.response.slice(0, 240)],
      taskHistory: [{ taskId: taskId.toString(), promptHash: String(task.promptRoot), resultHash: hashJson(resultPayload) }],
      updatedAt: new Date().toISOString()
    });

    const resultUpload = await uploadJson(resultPayload);
    const memoryUpload = await uploadJson(memoryPayload);
    let daCommitment = ethers.ZeroHash;
    let daStatus: "attached" | "not_attached" = "not_attached";
    const daResponse = await fetch(new URL("/api/da/submit", request.url), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        app: "agent.fun",
        version: "1.0",
        eventType: "task",
        agentId: prompt.agentId,
        taskId: taskId.toString(),
        requester: prompt.requester,
        executor: wallet.address,
        resultRoot: resultUpload.rootHash,
        memoryRoot: memoryUpload.rootHash,
        computeHash
      })
    });
    if (daResponse.ok) {
      const da = await daResponse.json();
      const candidate = String(da.commitment ?? da.blobHash ?? da.hash ?? "");
      if (candidate.startsWith("0x")) {
        daCommitment = bytes32(candidate);
        daStatus = "attached";
      }
    }

    const tx = await contract.completeTask(taskId, bytes32(resultUpload.rootHash), computeHash, daCommitment, bytes32(memoryUpload.rootHash));
    await tx.wait();
    return NextResponse.json({
      taskId: taskId.toString(),
      answer: result.response,
      model: result.model,
      provider: result.provider,
      resultRoot: resultUpload.rootHash,
      memoryRoot: memoryUpload.rootHash,
      computeHash,
      daCommitment,
      daStatus,
      runningTx: runningTxHash,
      completionTx: tx.hash
    });
  } catch (error) {
    return apiError(error, "Task execution failed.");
  }
}
