import { AgentMetadata, TaskPrompt } from "@shared/index";

export interface AgentRunResult {
  response: string;
  provider: string;
  model: string;
  usage?: unknown;
  trace?: unknown;
  chatId?: string;
}

export async function generateAgentProfile(input: { idea: string; category: string; model: string; apiKey?: string; baseUrl?: string }) {
  const prompt = `Create a concise launch profile for an AI agent on 0G. Idea: ${input.idea}. Category: ${input.category}.`;
  const result = await call0GCompute({
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    model: input.model,
    prompt,
    fallback: `A useful ${input.category} agent that turns user prompts into verifiable 0G-powered tasks.`
  });
  return { description: result.text, systemPrompt: `You are an autonomous ${input.category} agent. ${result.text}` };
}

export async function runAgentTask(input: { metadata: AgentMetadata; prompt: TaskPrompt; model: string; apiKey?: string; baseUrl?: string }): Promise<AgentRunResult> {
  const fallback = buildCapabilityResponse(input.metadata, input.prompt.prompt);
  const execution = await call0GCompute({
    apiKey: input.apiKey,
    baseUrl: input.baseUrl,
    model: input.model,
    prompt: `${input.metadata.systemPrompt}\n\nUser task:\n${input.prompt.prompt}`,
    fallback
  });
  return { response: execution.text, provider: "0G Compute", model: input.model, usage: execution.usage, chatId: execution.chatId };
}

function buildCapabilityResponse(metadata: AgentMetadata, prompt: string) {
  const intro = `${metadata.name} completed the task: "${prompt.slice(0, 180)}"`;
  if (metadata.category === "trading") {
    return `${intro}\n\nMarket research summary:\n- Identify the asset, timeframe, and liquidity before entering a position.\n- Treat volatility, oracle risk, and execution slippage as primary risks.\n- Use sealed/private inference for proprietary strategy notes.\n\nRisk note: this is research output, not financial advice or automated execution.`;
  }
  if (metadata.category === "social") {
    return `${intro}\n\nCampaign draft:\n- Lead with a sharp user benefit.\n- Add one proof point and one community call-to-action.\n- Keep replies short, specific, and native to crypto social channels.`;
  }
  if (metadata.category === "developer") {
    return `${intro}\n\nReview notes:\n- Check access control on privileged functions.\n- Verify external calls, fee accounting, and failure paths.\n- Add tests for rejected transactions, duplicate IDs, and proof recording.`;
  }
  if (metadata.category === "game") {
    return `${intro}\n\nPlayable content:\n- Quest hook: a memory-backed agent requests a rare proof fragment.\n- Objective: complete three verifiable actions and return with the receipt.\n- Reward: unlock a new branch in the agent's persistent story state.`;
  }
  if (metadata.category === "research") {
    return `${intro}\n\nResearch brief:\n- Extract the core question and define evidence needed.\n- Separate confirmed facts from assumptions.\n- Store reusable findings in the agent memory root after completion.`;
  }
  return `${intro}\n\nResponse:\n- Parsed the request into a clear objective.\n- Produced a concise output aligned with the agent profile.\n- Prepared result and memory material for 0G proof recording.`;
}

async function call0GCompute(input: { apiKey?: string; baseUrl?: string; model: string; prompt: string; fallback: string }) {
  const baseUrl = input.baseUrl ?? process.env.OG_COMPUTE_BASE_URL ?? process.env.NEXT_PUBLIC_0G_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1";
  const apiKey = input.apiKey ?? process.env.OG_COMPUTE_KEY ?? "";
  const demoMode = process.env.OG_DEMO_MODE === "true" || process.env.NEXT_PUBLIC_DEMO_MODE === "true";
  if (!apiKey) {
    if (demoMode) return { text: input.fallback };
    throw new Error("0G Compute is not configured. Set OG_COMPUTE_KEY for production task execution.");
  }

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: input.model,
      verify_tee: true,
      messages: [
        { role: "system", content: "You are a concise AI agent running through 0G Compute. Return useful output only." },
        { role: "user", content: input.prompt }
      ]
    })
  });
  if (!response.ok) throw new Error(`0G Compute failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  const text = body?.choices?.[0]?.message?.content;
  if (!text) throw new Error("0G Compute returned an empty response.");
  return {
    text,
    usage: body.usage,
    chatId: response.headers.get("ZG-Res-Key") ?? response.headers.get("zg-res-key") ?? body.id
  };
}
