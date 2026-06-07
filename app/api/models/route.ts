import { NextResponse } from "next/server";
import { getZeroGNetwork, ZeroGNetworkKey } from "@/lib/config";
import { computeModelMatrix } from "@/lib/compute-models";

const allowedIds = new Set(computeModelMatrix.map(({ model }) => model.id));

export async function GET(request: Request) {
  const networkKey: ZeroGNetworkKey = new URL(request.url).searchParams.get("network") === "testnet" ? "testnet" : "mainnet";
  try {
    if (networkKey === "mainnet") {
      try {
        const response = await fetch("https://router-api.0g.ai/v1/models", {
          next: { revalidate: 60 },
          signal: AbortSignal.timeout(8_000)
        });
        if (!response.ok) throw new Error(`Router catalog returned ${response.status}.`);
        const body = await response.json();
        const liveModels = Array.isArray(body.data) ? body.data.filter((model: { id?: string }) => model.id && allowedIds.has(model.id)) : [];
        if (liveModels.length > 0) {
          return NextResponse.json({ network: networkKey, source: "0G Router", models: liveModels });
        }
      } catch {
        // Router unavailable — fall through to static fallback
      }
      // Fall back to full static model list so the UI is never blocked by router downtime
      const models = [...allowedIds].map((id) => ({ id }));
      return NextResponse.json({ network: networkKey, source: "static fallback", models });
    }

    let liveModelIds = new Set<string>();
    try {
      const { createZGComputeNetworkReadOnlyBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      const network = getZeroGNetwork(networkKey);
      const broker = await createZGComputeNetworkReadOnlyBroker(network.rpcUrl, network.chainId);
      const services = await broker.inference.listServiceWithDetail(0, 50, false);
      for (const service of services) {
        const modelId = String((service as any).model ?? "");
        const metrics = (service as any).healthMetrics ?? {};
        const healthy = metrics.isHealthy != null ? Boolean(metrics.isHealthy) : metrics.healthy != null ? Boolean(metrics.healthy) : metrics.status !== "unhealthy";
        if (modelId && healthy) liveModelIds.add(modelId);
      }
    } catch {
      // If provider discovery fails on testnet, fall back to static model list so the UI is not blocked
    }
    // For testnet, if live discovery returned nothing fall back to the full static allowed set
    // so that model availability never hard-blocks the launch button on testnet
    const effectiveIds = liveModelIds.size > 0 ? liveModelIds : allowedIds;
    const models = [...effectiveIds]
      .filter((id) => allowedIds.has(id))
      .map((id) => ({ id }));
    return NextResponse.json({ network: networkKey, source: liveModelIds.size > 0 ? "0G Direct providers" : "static fallback", models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model discovery failed.";
    return NextResponse.json({ error: { code: "MODEL_DISCOVERY_FAILED", message }, network: networkKey, models: [] }, { status: 503 });
  }
}
