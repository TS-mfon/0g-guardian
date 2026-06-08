const DEFAULT_INPUT_TOKENS = 8_000n;
const DEFAULT_OUTPUT_TOKENS = 2_000n;

export interface ComputePrice {
  model: string;
  provider?: string;
  inputPrice: bigint;
  outputPrice: bigint;
  source: string;
}

export async function getLiveComputePrice(modelId: string): Promise<ComputePrice> {
  const response = await fetch("https://router-api.0g.ai/v1/models", { cache: "no-store" });
  if (!response.ok) throw new Error("Live 0G Router pricing is unavailable.");
  const catalog = await response.json();
  const model = (catalog.data ?? []).find((item: { id?: string }) => item.id === modelId);
  if (!model) throw new Error(`${modelId} is not currently available on 0G Router.`);
  return {
    model: modelId,
    inputPrice: BigInt(model.pricing?.prompt ?? "0"),
    outputPrice: BigInt(model.pricing?.completion ?? model.pricing?.output ?? "0"),
    source: "0G Router live pricing"
  };
}

export function quoteComputeBudget(price: ComputePrice, inputTokens = DEFAULT_INPUT_TOKENS, outputTokens = DEFAULT_OUTPUT_TOKENS) {
  return (((price.inputPrice * inputTokens) + (price.outputPrice * outputTokens)) * 12_000n) / 10_000n;
}

export function calculateActualComputeCost(price: ComputePrice, usage: unknown, maximum: bigint) {
  const value = usage as { prompt_tokens?: number; input_tokens?: number; completion_tokens?: number; output_tokens?: number };
  const input = BigInt(value?.prompt_tokens ?? value?.input_tokens ?? 0);
  const output = BigInt(value?.completion_tokens ?? value?.output_tokens ?? 0);
  const actual = (price.inputPrice * input) + (price.outputPrice * output);
  return actual > maximum ? maximum : actual;
}
