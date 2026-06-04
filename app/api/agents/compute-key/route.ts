import { NextResponse } from "next/server";
import { ethers } from "ethers";
import { getCreatorComputeStatus, saveCreatorComputeKey } from "@/lib/creator-compute-store";
import { readAgentFunContract } from "@/lib/agentfun";
import { clientConfig } from "@/lib/config";

function linkMessage(input: { agentId: string; creator: string }) {
  return [
    "Agent.fun creator compute link",
    `Agent ID: ${String(BigInt(input.agentId))}`,
    `Creator: ${input.creator.toLowerCase()}`,
    "I authorize this server to use my 0G Compute key only for paid tasks on this agent."
  ].join("\n");
}

async function loadAgentCreator(agentId: string) {
  const contract = readAgentFunContract();
  if (!contract) throw new Error("Agent.fun contract is not configured.");
  const agent = await contract.getAgent(BigInt(agentId));
  if (!agent.active) throw new Error("Agent is not active.");
  return String(agent.creator);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get("agentId") ?? "";
  if (!agentId) {
    return NextResponse.json({ error: { code: "AGENT_REQUIRED", message: "Agent ID is required." } }, { status: 400 });
  }
  return NextResponse.json(await getCreatorComputeStatus(agentId));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const agentId = String(body.agentId ?? "");
    const apiKey = String(body.apiKey ?? "");
    const signer = String(body.signer ?? "");
    const signature = String(body.signature ?? "");
    if (!agentId || !apiKey || !signer || !signature) {
      return NextResponse.json({ error: { code: "MISSING_FIELDS", message: "Agent ID, API key, signer, and signature are required." } }, { status: 400 });
    }

    const creator = await loadAgentCreator(agentId);
    if (creator.toLowerCase() !== signer.toLowerCase()) {
      return NextResponse.json({ error: { code: "ONLY_CREATOR", message: "Only the agent creator can link compute for this agent." } }, { status: 403 });
    }

    const recovered = ethers.verifyMessage(linkMessage({ agentId, creator }), signature);
    if (recovered.toLowerCase() !== creator.toLowerCase()) {
      return NextResponse.json({ error: { code: "BAD_SIGNATURE", message: "Wallet signature does not match the agent creator." } }, { status: 401 });
    }

    await saveCreatorComputeKey({
      agentId,
      creator,
      apiKey,
      baseUrl: String(body.baseUrl ?? clientConfig.computeBaseUrl),
      model: String(body.model ?? clientConfig.computeModel),
      provider: String(body.provider ?? "0G Compute")
    });

    return NextResponse.json(await getCreatorComputeStatus(agentId));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save 0G Compute key.";
    return NextResponse.json({ error: { code: "COMPUTE_KEY_FAILED", message } }, { status: 500 });
  }
}
