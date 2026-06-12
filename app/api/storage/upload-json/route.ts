import { NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/api";
import { uploadBytesTo0GFromServer } from "@/lib/storage-server";
import { enforceRateLimit, requireInternalApiKey } from "@/lib/api-security";

export async function POST(request: Request) {
  try {
    requireInternalApiKey(request);
    enforceRateLimit(request, "storage-upload", 5);
    const payload = await readJson(request, 256_000);
    const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    return NextResponse.json(await uploadBytesTo0GFromServer(encoded));
  } catch (error) {
    return apiError(error, "0G Storage upload failed.");
  }
}
