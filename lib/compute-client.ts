import { AgentMetadata, TaskPrompt } from "@shared/index";

export interface AgentRunResult {
  response: string;
  provider: string;
  model: string;
}

export async function generateAgentProfile(input: { idea: string; category: string; model: string; apiKey?: string }) {
  const prompt = `Create a concise launch profile for an AI agent on 0G. Idea: ${input.idea}. Category: ${input.category}.`;
  const text = await call0GCompute({
    apiKey: input.apiKey,
    model: input.model,
    prompt,
    fallback: `A useful ${input.category} agent that turns user prompts into verifiable 0G-powered tasks.`
  });
  return { description: text, systemPrompt: `You are an autonomous ${input.category} agent. ${text}` };
}

export async function runAgentTask(input: { metadata: AgentMetadata; prompt: TaskPrompt; model: string; apiKey?: string }): Promise<AgentRunResult> {
  const response = await call0GCompute({
    apiKey: input.apiKey,
    model: input.model,
    prompt: `${input.metadata.systemPrompt}\n\nUser task:\n${input.prompt.prompt}`,
    fallback: `${input.metadata.name} received the task and produced a structured response. Configure 0G Compute credentials for live decentralized inference.`
  });
  return { response, provider: input.apiKey ? "0G Compute" : "Development fallback", model: input.model };
}

async function call0GCompute(input: { apiKey?: string; model: string; prompt: string; fallback: string }) {
  const baseUrl = process.env.OG_COMPUTE_BASE_URL ?? process.env.NEXT_PUBLIC_0G_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1";
  const apiKey = input.apiKey ?? process.env.OG_COMPUTE_KEY ?? "";
  if (!apiKey) return input.fallback;

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: input.model,
      messages: [
        { role: "system", content: "You are a concise AI agent running through 0G Compute. Return useful output only." },
        { role: "user", content: input.prompt }
      ]
    })
  });
  if (!response.ok) throw new Error(`0G Compute failed: ${response.status} ${await response.text()}`);
  const body = await response.json();
  return body?.choices?.[0]?.message?.content ?? input.fallback;
}
