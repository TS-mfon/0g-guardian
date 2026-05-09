import { NextResponse } from "next/server";
import { hashJson } from "@/lib/hash";

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json({
    rootHash: hashJson(payload),
    mode: "deterministic-fallback",
    note: "Browser wallet uploads use the 0G Storage SDK. This API returns a deterministic root for serverless workflows without custodying a wallet."
  });
}
