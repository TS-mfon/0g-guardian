import { NextResponse } from "next/server";
import { agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { runAgentTask } from "@/lib/compute-client";
import { clientConfig } from "@/lib/config";
import { hashJson } from "@/lib/hash";

export async function POST(request: Request) {
  const body = await request.json();
  const metadata = agentMetadataSchema.parse(body.metadata);
  const prompt = taskPromptSchema.parse(body.prompt);
  const result = await runAgentTask({ metadata, prompt, model: body.model ?? clientConfig.computeModel });
  return NextResponse.json({ ...result, computeHash: hashJson(result) });
}
