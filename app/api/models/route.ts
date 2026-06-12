import { NextResponse } from "next/server";
import { computeModelMatrix, hasExecutionAdapter } from "@/lib/compute-models";

const allowedIds = new Set(computeModelMatrix.filter(({ model }) => hasExecutionAdapter(model)).map(({ model }) => model.id));
const MAX_CATALOG_AGE_MS = 15 * 60 * 1000;
let lastKnownGood: { verifiedAt: string; models: RouterModel[] } | null = null;

interface RouterModel {
  id: string;
  provider_count?: number;
  providers?: unknown[];
  [key: string]: unknown;
}

function hasLiveProvider(model: RouterModel) {
  if (typeof model.provider_count === "number") return model.provider_count > 0;
  if (Array.isArray(model.providers)) return model.providers.length > 0;
  return false;
}

export async function GET() {
  try {
    const response = await fetch("https://router-api.0g.ai/v1/models", {
      cache: "no-store",
      signal: AbortSignal.timeout(8_000)
    });
    if (!response.ok) throw new Error(`Router catalog returned ${response.status}.`);
    const body = await response.json();
    const liveModels = Array.isArray(body.data)
      ? body.data.filter((model: RouterModel) => model.id && allowedIds.has(model.id) && hasLiveProvider(model))
      : [];
    if (!liveModels.length) throw new Error("Router returned no approved models with live providers.");
    lastKnownGood = { verifiedAt: new Date().toISOString(), models: liveModels };
    return NextResponse.json({
      network: "mainnet",
      source: "0G Router",
      verifiedAt: lastKnownGood.verifiedAt,
      stale: false,
      launchEnabled: true,
      models: liveModels
    });
  } catch (error) {
    if (lastKnownGood) {
      const age = Date.now() - Date.parse(lastKnownGood.verifiedAt);
      if (age <= MAX_CATALOG_AGE_MS) {
        return NextResponse.json({
          network: "mainnet",
          source: "last-known-good 0G Router catalog",
          verifiedAt: lastKnownGood.verifiedAt,
          stale: false,
          launchEnabled: true,
          models: lastKnownGood.models
        });
      }
    }
    const message = error instanceof Error ? error.message : "Model discovery failed.";
    return NextResponse.json({
      error: { code: "MODEL_CATALOG_UNVERIFIED", message },
      network: "mainnet",
      source: "unavailable",
      verifiedAt: lastKnownGood?.verifiedAt ?? null,
      stale: true,
      launchEnabled: false,
      models: []
    }, { status: 503 });
  }
}
