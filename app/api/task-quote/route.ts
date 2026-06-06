import { NextResponse } from "next/server";
import { ZeroGNetworkKey } from "@/lib/config";
import { getLiveComputePrice, quoteComputeBudget } from "@/lib/compute-pricing";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const networkKey: ZeroGNetworkKey = body.network === "testnet" ? "testnet" : "mainnet";
    const modelId = String(body.model ?? "");
    if (!modelId) return NextResponse.json({ error: { code: "MODEL_REQUIRED", message: "Model is required." } }, { status: 400 });

    const price = await getLiveComputePrice(networkKey, modelId);
    const computeBudget = quoteComputeBudget(price);
    return NextResponse.json({
      network: networkKey,
      model: modelId,
      provider: price.provider,
      computeBudget: computeBudget.toString(),
      source: price.source,
      assumptions: { inputTokens: "8000", outputTokens: "2000", bufferBps: "12000" }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not create task quote.";
    return NextResponse.json({ error: { code: "TASK_QUOTE_FAILED", message } }, { status: 503 });
  }
}
