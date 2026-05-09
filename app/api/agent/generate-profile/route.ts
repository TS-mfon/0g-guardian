import { NextResponse } from "next/server";
import { generateAgentProfile } from "@/lib/compute-client";
import { clientConfig } from "@/lib/config";

export async function POST(request: Request) {
  const body = await request.json();
  const result = await generateAgentProfile({
    idea: String(body.idea ?? ""),
    category: String(body.category ?? "custom"),
    model: String(body.model ?? clientConfig.computeModel)
  });
  return NextResponse.json(result);
}
