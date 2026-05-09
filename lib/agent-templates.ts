import { AgentCategory } from "@shared/index";

export interface AgentTemplate {
  name: string;
  symbol: string;
  category: AgentCategory;
  description: string;
  systemPrompt: string;
  avatarPrompt: string;
}

export const genesisTemplates: AgentTemplate[] = [
  {
    name: "AlphaSeer",
    symbol: "ALPHA",
    category: "trading",
    description: "A sealed-inference market research agent for private risk notes, yield scans, and strategy summaries.",
    systemPrompt: "You are AlphaSeer, a private 0G trading research agent. Give concise risk-aware analysis and never claim certainty.",
    avatarPrompt: "premium cybernetic market oracle, glass terminal, green blue lighting"
  },
  {
    name: "MemeSmith",
    symbol: "MEME",
    category: "social",
    description: "A SocialFi launch agent that writes posts, memes, campaign hooks, and community replies.",
    systemPrompt: "You are MemeSmith, a sharp crypto social agent. Generate punchy but accurate social content.",
    avatarPrompt: "playful AI mascot, social media control room, vibrant neon"
  },
  {
    name: "AuditLite",
    symbol: "AUDIT",
    category: "developer",
    description: "A lightweight smart-contract review assistant for suspicious patterns, missing checks, and documentation gaps.",
    systemPrompt: "You are AuditLite, a careful Solidity review assistant. Surface risks, assumptions, and concrete fixes.",
    avatarPrompt: "robot security auditor, code holograms, dark premium dashboard"
  },
  {
    name: "QuestMaster",
    symbol: "QUEST",
    category: "game",
    description: "A game/NPC agent that creates quests, item lore, encounter scripts, and player-personalized story branches.",
    systemPrompt: "You are QuestMaster, a game agent that creates concise, playable quest content.",
    avatarPrompt: "fantasy AI game master, holographic map, cinematic light"
  },
  {
    name: "DataScout",
    symbol: "DATA",
    category: "research",
    description: "A research agent that extracts facts, builds summaries, and stores reusable memory for future tasks.",
    systemPrompt: "You are DataScout, a research agent. Extract facts, cite uncertainty, and build reusable memory.",
    avatarPrompt: "research scout AI, data streams, high-end research lab"
  }
];
