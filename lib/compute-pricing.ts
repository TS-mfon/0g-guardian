import { getZeroGNetwork, ZeroGNetworkKey } from "./config";

const DEFAULT_INPUT_TOKENS = 8_000n;
const DEFAULT_OUTPUT_TOKENS = 2_000n;

export interface ComputePrice {
  model: string;
  provider?: string;
  inputPrice: bigint;
  outputPrice: bigint;
  source: string;
}

export async function getLiveComputePrice(networkKey: ZeroGNetworkKey, modelId: string): Promise<ComputePrice> {
  if (networkKey === "mainnet") {
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

  const { createZGComputeNetworkReadOnlyBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
  const network = getZeroGNetwork(networkKey);
  const broker = await createZGComputeNetworkReadOnlyBroker(network.rpcUrl, network.chainId);
  const services = await broker.inference.listService(0, 50, false);
  const candidates = services
    .filter((service) => service.model === modelId && service.teeSignerAcknowledged)
    .sort((a, b) => (a.inputPrice + a.outputPrice) < (b.inputPrice + b.outputPrice) ? -1 : 1);
  if (!candidates.length) throw new Error(`${modelId} has no acknowledged Galileo provider.`);
  return {
    model: modelId,
    provider: candidates[0].provider,
    inputPrice: candidates[0].inputPrice,
    outputPrice: candidates[0].outputPrice,
    source: "0G Galileo direct provider pricing"
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
