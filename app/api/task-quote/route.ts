import { NextResponse } from "next/server";
import { getLiveComputePrice, quoteComputeBudget } from "@/lib/compute-pricing";
import { Contract, JsonRpcProvider, ethers } from "ethers";
import { agentFunCoreAbi } from "@shared/index";
import { getZeroGNetwork } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const modelId = String(body.model ?? "");
    if (!modelId) return NextResponse.json({ error: { code: "MODEL_REQUIRED", message: "Model is required." } }, { status: 400 });

    const price = await getLiveComputePrice(modelId);
    const computeBudget = quoteComputeBudget(price);
    const network = getZeroGNetwork();
    const contract = new Contract(network.agentFunCoreAddress, agentFunCoreAbi, new JsonRpcProvider(network.rpcUrl, network.chainId));
    const taskFee = BigInt(await contract.minTaskFee());
    return NextResponse.json({
      network: "mainnet",
      model: modelId,
      provider: price.provider,
      computeBudget: computeBudget.toString(),
      computeBudgetFormatted: ethers.formatEther(computeBudget),
      taskFee: ethers.formatEther(taskFee),
      total: ethers.formatEther(taskFee + computeBudget),
      storageCost: "Paid separately during prompt upload",
      source: price.source,
      assumptions: { inputTokens: "8000", outputTokens: "2000", bufferBps: "12000" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create task quote.";
    return NextResponse.json({ error: { code: "TASK_QUOTE_FAILED", message } }, { status: 503 });
  }
}
