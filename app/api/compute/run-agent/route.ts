import { NextResponse } from "next/server";
import { z } from "zod";
import { agentMetadataSchema, taskPromptSchema } from "@shared/index";
import { apiError, readSchema } from "@/lib/api";
import { runAgentTask } from "@/lib/compute-client";
import { clientConfig } from "@/lib/config";
import { hashJson } from "@/lib/hash";
import { enforceRateLimit, requireInternalApiKey } from "@/lib/api-security";

const runAgentSchema = z.object({
  metadata: agentMetadataSchema,
  prompt: taskPromptSchema,
  model: z.string().min(1).optional()
});

export async function POST(request: Request) {
  try {
    requireInternalApiKey(request);
    enforceRateLimit(request, "compute-run-agent", 3);
    const body = await readSchema(request, runAgentSchema, 80_000);
    const result = await runAgentTask({ metadata: body.metadata, prompt: body.prompt, model: body.model ?? clientConfig.computeModel });
    return NextResponse.json({ ...result, computeHash: hashJson(result) });
  } catch (error) {
    return apiError(error, "0G Compute request failed.");
  }
}
