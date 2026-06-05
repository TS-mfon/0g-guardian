import { NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/api";
import { uploadBytesTo0GFromServer } from "@/lib/storage-server";
import type { ZeroGNetworkKey } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const network = new URL(request.url).searchParams.get("network") === "testnet" ? "testnet" : "mainnet";
    const payload = await readJson(request, 256_000);
    const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    return NextResponse.json(await uploadBytesTo0GFromServer(encoded, network as ZeroGNetworkKey));
  } catch (error) {
    return apiError(error, "0G Storage upload failed.");
  }
}
