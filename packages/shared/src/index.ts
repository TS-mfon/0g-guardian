import { z } from "zod";

export const ZERO_G_MAINNET = {
  chainId: 16661,
  chainIdHex: "0x4115",
  rpcUrl: "https://evmrpc.0g.ai",
  storageIndexer: "https://indexer-storage-turbo.0g.ai",
  explorerUrl: "https://chainscan.0g.ai",
  storageScanUrl: "https://storagescan.0g.ai"
} as const;

export const agentFunCoreAbi = [
  "function launchFee() view returns (uint256)",
  "function minTaskFee() view returns (uint256)",
  "function nextAgentId() view returns (uint256)",
  "function launchAgent(string name,string symbol,string category,uint256 agentIdTokenId,bytes32 metadataRoot,bytes32 memoryRoot,bytes32 capabilityHash) payable returns (uint256)",
  "function updateMemoryRoot(uint256 agentId,bytes32 newMemoryRoot)",
  "function setAgentActive(uint256 agentId,bool active)",
  "function buyKeys(uint256 agentId,uint256 keysOut) payable returns (uint256)",
  "function sellKeys(uint256 agentId,uint256 keysIn,uint256 minOut) returns (uint256)",
  "function createTask(uint256 agentId,bytes32 promptRoot) payable returns (uint256)",
  "function completeTask(uint256 taskId,bytes32 resultRoot,bytes32 computeHash,bytes32 daCommitment,bytes32 newMemoryRoot)",
  "function rateTask(uint256 taskId,uint8 rating)",
  "function claimRevenue() returns (uint256)",
  "function getBuyPrice(uint256 agentId,uint256 amount) view returns (uint256)",
  "function getSellPrice(uint256 agentId,uint256 amount) view returns (uint256)",
  "function keyBalance(uint256 agentId,address user) view returns (uint256)",
  "function keySupply(uint256 agentId) view returns (uint256)",
  "function agentReserve(uint256 agentId) view returns (uint256)",
  "function claimable(address account) view returns (uint256)",
  "function getAgent(uint256 agentId) view returns (uint256 id,address creator,uint256 agentIdTokenId,string name,string symbol,string category,bytes32 metadataRoot,bytes32 memoryRoot,bytes32 capabilityHash,uint256 createdAt,bool active,uint256 taskCount,uint256 totalRevenue)",
  "function getTask(uint256 taskId) view returns (uint256 id,uint256 agentId,address requester,uint256 fee,bytes32 promptRoot,bytes32 resultRoot,bytes32 computeHash,bytes32 daCommitment,uint8 status,uint256 createdAt,uint256 completedAt,uint8 rating)",
  "function getAllAgentIds() view returns (uint256[])",
  "function getAllTaskIds() view returns (uint256[])",
  "event AgentLaunched(uint256 indexed agentId,address indexed creator,uint256 indexed agentIdTokenId,string name,string symbol,bytes32 metadataRoot,bytes32 memoryRoot)",
  "event AgentMemoryUpdated(uint256 indexed agentId,bytes32 previousRoot,bytes32 newRoot)",
  "event AgentStatusChanged(uint256 indexed agentId,bool active)",
  "event KeysBought(uint256 indexed agentId,address indexed buyer,uint256 keysOut,uint256 paid)",
  "event KeysSold(uint256 indexed agentId,address indexed seller,uint256 keysIn,uint256 received)",
  "event TaskCreated(uint256 indexed taskId,uint256 indexed agentId,address indexed requester,uint256 fee,bytes32 promptRoot)",
  "event TaskCompleted(uint256 indexed taskId,uint256 indexed agentId,bytes32 resultRoot,bytes32 computeHash,bytes32 daCommitment,bytes32 newMemoryRoot)",
  "event TaskRated(uint256 indexed taskId,uint8 rating)",
  "event RevenueClaimed(address indexed account,uint256 amount)"
] as const;

export const agenticIdAbi = [
  "function mint(address to,string encryptedURI,bytes32 metadataHash) returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)",
  "event AgentMetadataUpdated(uint256 indexed tokenId,string encryptedURI,bytes32 metadataHash)"
] as const;

export const categorySchema = z.enum(["chat", "research", "trading", "social", "game", "developer", "custom"]);

export const agentMetadataSchema = z.object({
  version: z.literal("1.0"),
  app: z.literal("agent.fun"),
  name: z.string().min(1).max(80),
  symbol: z.string().min(1).max(16),
  description: z.string().min(1).max(1000),
  category: categorySchema,
  creator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  agentIdTokenId: z.string().min(1),
  avatar: z.object({
    prompt: z.string(),
    storageRoot: z.string().optional(),
    mimeType: z.string().optional()
  }),
  systemPrompt: z.string().min(1).max(6000),
  model: z.object({
    provider: z.literal("0G Compute"),
    modelId: z.string().min(1),
    teeRequired: z.boolean()
  }),
  pricing: z.object({
    minTaskFee: z.string(),
    chatFee: z.string(),
    creatorFeeBps: z.number().int().min(0).max(10000)
  }),
  createdAt: z.string()
});

export const agentMemorySchema = z.object({
  version: z.literal("1.0"),
  agentId: z.string(),
  memoryIndex: z.number().int().nonnegative(),
  previousMemoryRoot: z.string().optional(),
  longTermSummary: z.string(),
  userPreferences: z.record(z.string(), z.unknown()),
  learnedFacts: z.array(z.string()),
  taskHistory: z.array(z.object({
    taskId: z.string(),
    promptHash: z.string(),
    resultHash: z.string(),
    rating: z.number().int().min(1).max(5).optional()
  })),
  updatedAt: z.string()
});

export const taskPromptSchema = z.object({
  version: z.literal("1.0"),
  agentId: z.string(),
  requester: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  prompt: z.string().min(1).max(8000),
  createdAt: z.string()
});

export const taskResultSchema = z.object({
  version: z.literal("1.0"),
  taskId: z.string(),
  agentId: z.string(),
  requester: z.string(),
  response: z.string().min(1),
  computeProvider: z.string(),
  computeModel: z.string(),
  computeHash: z.string(),
  memoryRootBefore: z.string(),
  memoryRootAfter: z.string(),
  createdAt: z.string()
});

export type AgentCategory = z.infer<typeof categorySchema>;
export type AgentMetadata = z.infer<typeof agentMetadataSchema>;
export type AgentMemory = z.infer<typeof agentMemorySchema>;
export type TaskPrompt = z.infer<typeof taskPromptSchema>;
export type TaskResult = z.infer<typeof taskResultSchema>;
