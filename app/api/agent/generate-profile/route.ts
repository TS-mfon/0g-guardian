import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, readSchema } from "@/lib/api";
import { generateAgentProfile } from "@/lib/compute-client";
import { clientConfig } from "@/lib/config";
import { enforceRateLimit, requireInternalApiKey } from "@/lib/api-security";

const profileRequestSchema = z.object({
  idea: z.string().min(1).max(2000),
  category: z.string().min(1).max(40).default("custom"),
  model: z.string().min(1).optional()
});

export async function POST(request: Request) {
  try {
    requireInternalApiKey(request);
    enforceRateLimit(request, "generate-profile", 3);
    const body = await readSchema(request, profileRequestSchema, 32_000);
    const result = await generateAgentProfile({
      idea: body.idea,
      category: body.category,
      model: body.model ?? clientConfig.computeModel
    });
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error, "Agent profile generation failed.");
  }
}
