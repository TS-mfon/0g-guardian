import { NextResponse } from "next/server";
import { hashJson } from "@/lib/hash";

export async function POST(request: Request) {
  const payload = await request.json();
  return NextResponse.json({
    commitment: hashJson({ ...payload, da: "0g" }),
    mode: process.env.OG_DA_GATEWAY_URL ? "gateway-ready" : "deterministic-fallback",
    note: "Set OG_DA_GATEWAY_URL to submit this payload through a live 0G DA client."
  });
}
