import { NextResponse } from "next/server";
import { apiError, readJson } from "@/lib/api";
import { uploadBytesTo0GFromServer } from "@/lib/storage-server";

export async function POST(request: Request) {
  try {
    const payload = await readJson(request, 256_000);
    const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
    return NextResponse.json(await uploadBytesTo0GFromServer(encoded));
  } catch (error) {
    return apiError(error, "0G Storage upload failed.");
  }
}
