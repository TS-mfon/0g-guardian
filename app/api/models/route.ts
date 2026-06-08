import { NextResponse } from "next/server";
import { computeModelMatrix } from "@/lib/compute-models";

const allowedIds = new Set(computeModelMatrix.map(({ model }) => model.id));

export async function GET() {
  try {
    try {
      const response = await fetch("https://router-api.0g.ai/v1/models", {
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(8_000)
      });
      if (!response.ok) throw new Error(`Router catalog returned ${response.status}.`);
      const body = await response.json();
      const liveModels = Array.isArray(body.data) ? body.data.filter((model: { id?: string }) => model.id && allowedIds.has(model.id)) : [];
      if (liveModels.length > 0) {
        return NextResponse.json({ network: "mainnet", source: "0G Router", models: liveModels });
      }
    } catch {
      // Router unavailable — fall through to static fallback
    }
    // Fall back to full static model list so the UI is never blocked by router downtime
    const models = [...allowedIds].map((id) => ({ id }));
    return NextResponse.json({ network: "mainnet", source: "static fallback", models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model discovery failed.";
    return NextResponse.json({ error: { code: "MODEL_DISCOVERY_FAILED", message }, network: "mainnet", models: [] }, { status: 503 });
  }
}
