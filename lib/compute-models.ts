import { AgentCategory } from "@shared/index";

export type ComputeTier = "cheap" | "default" | "premium";
export type ComputeModality = "chat" | "vision" | "image" | "audio";

export interface ComputeModelOption {
  id: string;
  label: string;
  tier: ComputeTier;
  modality: ComputeModality;
  teeRequired?: boolean;
  reason: string;
}

export const computeModelsByCategory: Record<AgentCategory, ComputeModelOption[]> = {
  chat: [
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", teeRequired: true, reason: "Low-cost, long-context, TEE-ready chat execution." },
    { id: "qwen/qwen2.5-omni-7b", label: "Qwen 2.5 Omni 7B", tier: "cheap", modality: "chat", teeRequired: true, reason: "Live Galileo multimodal provider for testnet chat execution." }
  ],
  research: [
    { id: "qwen3.6-plus", label: "Qwen 3.6 Plus", tier: "default", modality: "chat", reason: "Stronger reasoning for research briefs and synthesis." },
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "cheap", modality: "chat", reason: "Lower-cost research summaries and recurring tasks." },
    { id: "qwen/qwen2.5-omni-7b", label: "Qwen 2.5 Omni 7B", tier: "cheap", modality: "chat", teeRequired: true, reason: "Live Galileo provider for testnet research tasks." }
  ],
  developer: [
    { id: "0GM-1.0-35B-A3B", label: "0GM 1.0 35B A3B", tier: "default", modality: "chat", reason: "0G-native coding, audit, and implementation work." },
    { id: "deepseek-v4-pro", label: "DeepSeek V4 Pro", tier: "premium", modality: "chat", reason: "Premium reasoning for deeper engineering tasks." }
  ],
  trading: [
    { id: "glm-5", label: "GLM-5", tier: "default", modality: "chat", teeRequired: true, reason: "Private trading research with TEE-required execution." },
    { id: "zai-org/GLM-5-FP8", label: "GLM-5 FP8", tier: "premium", modality: "chat", teeRequired: true, reason: "Premium sealed-inference trading and risk work." }
  ],
  social: [
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", reason: "Fast, low-cost social content and campaign work." },
    { id: "qwen/qwen2.5-omni-7b", label: "Qwen 2.5 Omni 7B", tier: "cheap", modality: "chat", teeRequired: true, reason: "Live Galileo provider for testnet social tasks." }
  ],
  game: [
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", reason: "Low-latency quests, lore, and NPC task execution." },
    { id: "qwen/qwen2.5-omni-7b", label: "Qwen 2.5 Omni 7B", tier: "cheap", modality: "chat", teeRequired: true, reason: "Live Galileo provider for testnet interactive tasks." }
  ],
  vision: [
    { id: "qwen/qwen3-vl-30b-a3b-instruct", label: "Qwen3 VL 30B", tier: "default", modality: "vision", reason: "Vision-language analysis for multimodal agents." },
    { id: "qwen/qwen2.5-omni-7b", label: "Qwen 2.5 Omni 7B", tier: "cheap", modality: "vision", teeRequired: true, reason: "Live Galileo provider for multimodal testnet agents." }
  ],
  image: [
    { id: "z-image", label: "Z-Image", tier: "default", modality: "image", reason: "Image generation and creative production tasks." },
    { id: "qwen/qwen-image-edit-2511", label: "Qwen Image Edit 2511", tier: "default", modality: "image", teeRequired: true, reason: "Live Galileo image editing provider." }
  ],
  audio: [
    { id: "openai/whisper-large-v3", label: "Whisper Large V3", tier: "default", modality: "audio", reason: "Audio transcription and speech processing tasks." },
    { id: "qwen/qwen2.5-omni-7b", label: "Qwen 2.5 Omni 7B", tier: "cheap", modality: "audio", teeRequired: true, reason: "Live Galileo multimodal provider for testnet audio tasks." }
  ],
  custom: [
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", reason: "Flexible default for custom agent workflows." },
    { id: "qwen/qwen2.5-omni-7b", label: "Qwen 2.5 Omni 7B", tier: "cheap", modality: "chat", teeRequired: true, reason: "Live Galileo provider for custom testnet workflows." }
  ]
};

export const agentCategories = Object.keys(computeModelsByCategory) as AgentCategory[];

export const computeModelMatrix = agentCategories.flatMap((category) =>
  computeModelsByCategory[category].map((model) => ({ category, model }))
);

export function getDefaultComputeModel(category: AgentCategory) {
  return computeModelsByCategory[category][0];
}

export function findComputeModel(category: AgentCategory, modelId: string) {
  return computeModelsByCategory[category].find((model) => model.id === modelId) ?? getDefaultComputeModel(category);
}

export function isModelAllowedForCategory(category: AgentCategory, modelId: string) {
  return computeModelsByCategory[category].some((model) => model.id === modelId);
}
