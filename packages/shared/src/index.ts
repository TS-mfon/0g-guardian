import { z } from "zod";

export const ZERO_G_MAINNET = {
  chainId: 16661,
  chainIdHex: "0x4115",
  rpcUrl: "https://evmrpc.0g.ai",
  storageIndexer: "https://indexer-storage-turbo.0g.ai",
  explorerUrl: "https://chainscan.0g.ai",
  storageScanUrl: "https://storagescan.0g.ai"
} as const;

export const ZERO_G_GALILEO = {
  chainId: 16602,
  chainIdHex: "0x40da",
  rpcUrl: "https://evmrpc-testnet.0g.ai",
  storageIndexer: "https://indexer-storage-testnet-turbo.0g.ai",
  explorerUrl: "https://chainscan-galileo.0g.ai",
  storageScanUrl: "https://storagescan-galileo.0g.ai"
} as const;

export const agentFunCoreAbi = [
  "function launchFee() view returns (uint256)",
  "function activationFee() view returns (uint256)",
  "function minTaskFee() view returns (uint256)",
  "function owner() view returns (address)",
  "function protocolTreasury() view returns (address)",
  "function computeTreasury() view returns (address)",
  "function protocolFeeBps() view returns (uint256)",
  "function BPS() view returns (uint256)",
  "function launchesPaused() view returns (bool)",
  "function tasksPaused() view returns (bool)",
  "function marketPaused() view returns (bool)",
  "function nextAgentId() view returns (uint256)",
  "function nextTaskId() view returns (uint256)",
  "function modelHash(string modelId) pure returns (bytes32)",
  "function approvedModels(bytes32 modelHash) view returns (bool)",
  "function setModelApproval(bytes32 modelHash,bool approved)",
  "function setExecutor(address executor,bool allowed)",
  "function setPauseState(bool pauseLaunches,bool pauseTasks,bool pauseMarket)",
  "function launchAgent(string name,string symbol,string category,uint256 agentIdTokenId,bytes32 metadataRoot,bytes32 memoryRoot,bytes32 capabilityHash,string modelId) payable returns (uint256)",
  "function activateAgent(uint256 agentId) payable",
  "function updateMemoryRoot(uint256 agentId,bytes32 newMemoryRoot)",
  "function setAgentActive(uint256 agentId,bool active)",
  "function buyKeys(uint256 agentId,uint256 keysOut,uint256 maxPayment) payable returns (uint256)",
  "function sellKeys(uint256 agentId,uint256 keysIn,uint256 minOut) returns (uint256)",
  "function createTask(uint256 agentId,bytes32 promptRoot,uint256 computeBudget,uint256 deadline) payable returns (uint256)",
  "function markTaskRunning(uint256 taskId)",
  "function completeTask(uint256 taskId,bytes32 resultRoot,bytes32 computeHash,bytes32 newMemoryRoot,uint256 actualComputeCost)",
  "function cancelExpiredTask(uint256 taskId) returns (uint256)",
  "function rateTask(uint256 taskId,uint8 rating)",
  "function claimAgentRevenue(uint256 agentId) returns (uint256)",
  "function getBuyPrice(uint256 agentId,uint256 amount) view returns (uint256)",
  "function getSellPrice(uint256 agentId,uint256 amount) view returns (uint256)",
  "function keyBalance(uint256 agentId,address user) view returns (uint256)",
  "function keySupply(uint256 agentId) view returns (uint256)",
  "function agentReserve(uint256 agentId) view returns (uint256)",
  "function agentCreatorClaimable(uint256 agentId) view returns (uint256)",
  "function getAgent(uint256 agentId) view returns ((uint256 id,address creator,uint256 agentIdTokenId,string name,string symbol,string category,bytes32 metadataRoot,bytes32 memoryRoot,bytes32 capabilityHash,string modelId,bytes32 modelHash,uint256 createdAt,bool active,bool computeActive,uint256 taskCount,uint256 totalRevenue))",
  "function getTask(uint256 taskId) view returns ((uint256 id,uint256 agentId,address requester,address executor,uint256 fee,uint256 computeBudget,uint256 actualComputeCost,bytes32 promptRoot,bytes32 resultRoot,bytes32 computeHash,uint8 status,uint256 createdAt,uint256 deadline,uint256 completedAt,uint8 rating))",
  "function getAgentIds(uint256 offset,uint256 limit) view returns (uint256[])",
  "function getTaskIds(uint256 offset,uint256 limit) view returns (uint256[])",
  "event AgentLaunched(uint256 indexed agentId,address indexed creator,uint256 indexed agentIdTokenId,bytes32 modelHash)",
  "event AgentActivated(uint256 indexed agentId,bytes32 indexed modelHash,uint256 computeSeed,uint256 protocolFee)",
  "event AgentMemoryUpdated(uint256 indexed agentId,bytes32 previousRoot,bytes32 newRoot)",
  "event AgentStatusChanged(uint256 indexed agentId,bool active)",
  "event ExecutorUpdated(address indexed executor,bool allowed)",
  "event PauseStateChanged(bool launchesPaused,bool tasksPaused,bool marketPaused)",
  "event KeysBought(uint256 indexed agentId,address indexed buyer,uint256 keysOut,uint256 paid)",
  "event KeysSold(uint256 indexed agentId,address indexed seller,uint256 keysIn,uint256 received)",
  "event TaskCreated(uint256 indexed taskId,uint256 indexed agentId,address indexed requester,uint256 fee,uint256 computeBudget)",
  "event TaskRunning(uint256 indexed taskId,address indexed executor)",
  "event TaskCompleted(uint256 indexed taskId,uint256 indexed agentId,bytes32 resultRoot,bytes32 computeHash,bytes32 newMemoryRoot,uint256 creatorAmount,uint256 protocolFee,uint256 computeCost,uint256 refund)",
  "event TaskRefunded(uint256 indexed taskId,address indexed requester,uint256 amount)",
  "event AgentRevenueClaimed(uint256 indexed agentId,address indexed creator,uint256 amount)"
] as const;

export const agenticIdAbi = [
  "function nextTokenId() view returns (uint256)",
  "function mint(address to,string encryptedURI,bytes32 metadataHash) returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event Transfer(address indexed from,address indexed to,uint256 indexed tokenId)",
  "event AgentMetadataUpdated(uint256 indexed tokenId,string encryptedURI,bytes32 metadataHash)"
] as const;

export const categorySchema = z.enum(["chat", "research", "trading", "social", "game", "developer", "vision", "image", "audio", "custom"]);

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
    tier: z.enum(["cheap", "default", "premium"]).optional(),
    modality: z.enum(["chat", "vision", "image", "audio"]).optional(),
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
