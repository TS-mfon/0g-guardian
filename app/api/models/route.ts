import { NextResponse } from "next/server";
import { getZeroGNetwork, ZeroGNetworkKey } from "@/lib/config";
import { computeModelMatrix } from "@/lib/compute-models";

const allowedIds = new Set(computeModelMatrix.map(({ model }) => model.id));

export async function GET(request: Request) {
  const networkKey: ZeroGNetworkKey = new URL(request.url).searchParams.get("network") === "testnet" ? "testnet" : "mainnet";
  try {
    if (networkKey === "mainnet") {
      const response = await fetch("https://router-api.0g.ai/v1/models", { next: { revalidate: 60 } });
      if (!response.ok) throw new Error(`Router catalog returned ${response.status}.`);
      const body = await response.json();
      const models = Array.isArray(body.data) ? body.data.filter((model: { id?: string }) => model.id && allowedIds.has(model.id)) : [];
      return NextResponse.json({ network: networkKey, source: "0G Router", models });
    }

    const { createZGComputeNetworkReadOnlyBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
    const network = getZeroGNetwork(networkKey);
    const broker = await createZGComputeNetworkReadOnlyBroker(network.rpcUrl, network.chainId);
    const services = await broker.inference.listServiceWithDetail(0, 50, false);
    const models = services
      .map((service: any) => ({
        id: String(service.model ?? service.service?.model ?? ""),
        provider: String(service.provider ?? service.service?.provider ?? ""),
        serviceType: String(service.serviceType ?? service.service?.serviceType ?? ""),
        inputPrice: String(service.inputPrice ?? service.service?.inputPrice ?? "0"),
        outputPrice: String(service.outputPrice ?? service.service?.outputPrice ?? "0"),
        tee: service.teeSignerAcknowledged ?? service.service?.teeSignerAcknowledged ?? true,
        healthy: service.healthMetrics?.isHealthy ?? service.healthMetrics?.healthy ?? true
      }))
      .filter((model: { id: string; healthy: boolean }) => allowedIds.has(model.id) && model.healthy);
    return NextResponse.json({ network: networkKey, source: "0G Direct providers", models });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Model discovery failed.";
    return NextResponse.json({ error: { code: "MODEL_DISCOVERY_FAILED", message }, network: networkKey, models: [] }, { status: 503 });
  }
}
