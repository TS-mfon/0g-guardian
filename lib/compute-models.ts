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
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", teeRequired: true, reason: "Low-cost, long-context, TEE-ready chat execution." }
  ],
  research: [
    { id: "qwen3.6-plus", label: "Qwen 3.6 Plus", tier: "default", modality: "chat", reason: "Stronger reasoning for research briefs and synthesis." },
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "cheap", modality: "chat", reason: "Lower-cost research summaries and recurring tasks." }
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
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", reason: "Fast, low-cost social content and campaign work." }
  ],
  game: [
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", reason: "Low-latency quests, lore, and NPC task execution." }
  ],
  vision: [
    { id: "qwen/qwen3-vl-30b-a3b-instruct", label: "Qwen3 VL 30B", tier: "default", modality: "vision", reason: "Vision-language analysis for multimodal agents." }
  ],
  image: [
    { id: "z-image-turbo", label: "Z-Image Turbo", tier: "default", modality: "image", reason: "Live Router image generation for creative production tasks." }
  ],
  audio: [
    { id: "openai/whisper-large-v3", label: "Whisper Large V3", tier: "default", modality: "audio", reason: "Audio transcription and speech processing tasks." }
  ],
  custom: [
    { id: "deepseek-v4-flash", label: "DeepSeek V4 Flash", tier: "default", modality: "chat", reason: "Flexible default for custom agent workflows." }
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

export function hasExecutionAdapter(model: ComputeModelOption) {
  return model.modality === "chat";
}
