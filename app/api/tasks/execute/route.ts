import { NextResponse } from "next/server";
import { Contract, JsonRpcProvider, Wallet, ethers } from "ethers";
import { agentFunCoreAbi, agentMemorySchema, agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { apiError, readJson } from "@/lib/api";
import { getZeroGNetwork, isAddressConfigured, ZeroGNetworkKey } from "@/lib/config";
import { calculateActualComputeCost, getLiveComputePrice } from "@/lib/compute-pricing";
import { hashJson } from "@/lib/hash";
import { runAgentTask } from "@/lib/compute-client";
import { downloadJsonFrom0G, uploadBytesTo0GFromServer } from "@/lib/storage-server";

function bytes32(value: string) {
  return ethers.zeroPadValue(value as `0x${string}`, 32);
}

async function uploadJson(payload: unknown, network: ZeroGNetworkKey) {
  const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  return uploadBytesTo0GFromServer(encoded, network);
}

function executorWallet(networkKey: ZeroGNetworkKey) {
  const privateKey = (
    process.env.EXECUTOR_PRIVATE_KEY ??
    process.env.SERVER_WALLET_PRIVATE_KEY ??
    process.env.DEPLOYER_PRIVATE_KEY ??
    process.env.PRIVATE_KEY ??
    ""
  ).trim();
  if (!privateKey) throw new Error("EXECUTOR_PRIVATE_KEY is not configured.");
  const network = getZeroGNetwork(networkKey);
  const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
  return new Wallet(privateKey, provider);
}

export async function POST(request: Request) {
  try {
    const body = await readJson(request, 96_000);
    const networkKey: ZeroGNetworkKey = body.network === "testnet" ? "testnet" : "mainnet";
    const network = getZeroGNetwork(networkKey);
    if (!isAddressConfigured(network.agentFunCoreAddress)) {
      return NextResponse.json({ error: { code: "CONTRACT_NOT_CONFIGURED", message: "Agent.fun contract is not configured." } }, { status: 500 });
    }

    const taskId = BigInt(String(body.taskId ?? "0"));
    if (taskId === 0n) {
      return NextResponse.json({ error: { code: "INVALID_TASK", message: "A valid task ID is required." } }, { status: 400 });
    }

    const prompt = taskPromptSchema.parse(body.prompt);
    const wallet = executorWallet(networkKey);
    const contract = new Contract(network.agentFunCoreAddress, agentFunCoreAbi, wallet);
    const task = await contract.getTask(taskId);
    const agent = await contract.getAgent(task.agentId);
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

    const metadata = agentMetadataSchema.parse(await downloadJsonFrom0G(String(agent.metadataRoot), networkKey));
    if (metadata.creator.toLowerCase() !== String(agent.creator).toLowerCase()) {
      throw new Error("Stored metadata creator does not match the on-chain agent.");
    }
    if (metadata.model.modelId !== String(agent.modelId)) {
      throw new Error("Stored metadata model does not match the on-chain agent.");
    }
    const price = await getLiveComputePrice(networkKey, String(agent.modelId));
    const apiKey = networkKey === "testnet" ? process.env.OG_TESTNET_COMPUTE_KEY : process.env.OG_COMPUTE_KEY;
    const baseUrl = networkKey === "testnet" ? process.env.OG_TESTNET_COMPUTE_BASE_URL : process.env.OG_COMPUTE_BASE_URL;
    const result = await runAgentTask({
      metadata,
      prompt,
      model: String(agent.modelId),
      apiKey,
      baseUrl
    });
    if (networkKey === "testnet" && price.provider && result.chatId) {
      const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      const broker = await createZGComputeNetworkBroker(wallet);
      await broker.inference.processResponse(price.provider, result.chatId, JSON.stringify(result.usage ?? {}));
    }
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

    const [resultUpload, memoryUpload] = await Promise.all([uploadJson(resultPayload, networkKey), uploadJson(memoryPayload, networkKey)]);
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
  }
}
