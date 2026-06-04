import { NextResponse } from "next/server";
import { hashJson } from "@/lib/hash";

export async function POST(request: Request) {
  const payload = await request.json();
  const gatewayUrl = process.env.OG_DA_GATEWAY_URL ?? process.env.NEXT_PUBLIC_DA_GATEWAY_URL ?? "";
  if (gatewayUrl) {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      return NextResponse.json(
        { error: { code: "DA_GATEWAY_FAILED", message: "0G DA submission failed. The task will remain pending." } },
        { status: 502 }
      );
    }
    return NextResponse.json(await response.json());
  }

  if (process.env.OG_DEMO_MODE !== "true" && process.env.NEXT_PUBLIC_DEMO_MODE !== "true") {
    return NextResponse.json(
      { error: { code: "DA_NOT_CONFIGURED", message: "0G DA is not configured. The task will remain pending until DA is available." } },
      { status: 503 }
    );
  }

  return NextResponse.json({
    commitment: hashJson({ ...payload, da: "0g" }),
    mode: process.env.OG_DA_GATEWAY_URL ? "gateway-ready" : "deterministic-fallback",
    note: "Set OG_DA_GATEWAY_URL to submit this payload through a live 0G DA client."
  });
}
