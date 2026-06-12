import { Contract, JsonRpcProvider, ethers } from "ethers";
import { agentFunCoreAbi } from "@shared/index";
import { getZeroGNetwork, isAddressConfigured, ZeroGNetworkKey } from "./config";

export interface AgentView {
  id: string;
  creator: string;
  agentIdTokenId: string;
  name: string;
  symbol: string;
  category: string;
  metadataRoot: string;
  memoryRoot: string;
  capabilityHash: string;
  modelId: string;
  modelHash: string;
  createdAt: string;
  active: boolean;
  computeActive: boolean;
  taskCount: string;
  totalRevenue: string;
  keySupply: string;
  reserve: string;
  currentKeyPrice: string;
  sellQuote: string;
  marketCap: string;
  readinessScore: number;
}

export interface TaskView {
  id: string;
  agentId: string;
  requester: string;
  executor: string;
  fee: string;
  computeBudget: string;
  actualComputeCost: string;
  status: number;
  createdAt: string;
  deadline: string;
  promptRoot: string;
  resultRoot: string;
  computeHash: string;
  completedAt: string;
  rating: number;
}

export function readProvider(networkKey: ZeroGNetworkKey = "mainnet") {
  const network = getZeroGNetwork(networkKey);
  return new JsonRpcProvider(network.rpcUrl, network.chainId);
}

export function readAgentFunContract(networkKey: ZeroGNetworkKey = "mainnet") {
  const network = getZeroGNetwork(networkKey);
  if (!isAddressConfigured(network.agentFunCoreAddress)) return null;
  return new Contract(network.agentFunCoreAddress, agentFunCoreAbi, readProvider(networkKey));
}

export async function loadAgentsFromChain(networkKey: ZeroGNetworkKey = "mainnet"): Promise<AgentView[]> {
  const contract = readAgentFunContract(networkKey);
  if (!contract) return [];
  try {
    let ids: bigint[];
    try {
      ids = await contract.getAgentIds(0, 100);
    } catch { ids = []; }
    const agents = await Promise.all(ids.map(async (id) => {
      const agent = await contract.getAgent(id);
      const keySupply = await contract.keySupply(id);
      const reserve = await contract.agentReserve(id);
      const currentKeyPrice = await contract.getBuyPrice(id, 1n);
      const sellQuote = keySupply > 0n ? await contract.getSellPrice(id, 1n) : 0n;
      const marketCap = currentKeyPrice * keySupply;
      const readinessScore = [
        agent.active,
        agent.metadataRoot !== ethers.ZeroHash,
        agent.memoryRoot !== ethers.ZeroHash,
        agent.capabilityHash !== ethers.ZeroHash,
        agent.taskCount > 0n
      ].filter(Boolean).length * 20;
      return {
        id: agent.id.toString(),
        creator: agent.creator,
        agentIdTokenId: agent.agentIdTokenId.toString(),
        name: agent.name,
        symbol: agent.symbol,
        category: agent.category,
        metadataRoot: agent.metadataRoot,
        memoryRoot: agent.memoryRoot,
        capabilityHash: agent.capabilityHash,
        modelId: agent.modelId,
        modelHash: agent.modelHash,
        createdAt: agent.createdAt.toString(),
        active: agent.active,
        computeActive: agent.computeActive,
        taskCount: agent.taskCount.toString(),
        totalRevenue: ethers.formatEther(agent.totalRevenue),
        keySupply: keySupply.toString(),
        reserve: ethers.formatEther(reserve),
        currentKeyPrice: ethers.formatEther(currentKeyPrice),
        sellQuote: ethers.formatEther(sellQuote),
        marketCap: ethers.formatEther(marketCap),
        readinessScore
      } satisfies AgentView;
    }));
    return agents.reverse();
  } catch (error) {
    console.warn("Unable to load Agent.fun agents from 0G Chain", error);
    return [];
  }
}

export async function loadTasksFromChain(networkKey: ZeroGNetworkKey = "mainnet"): Promise<TaskView[]> {
  const contract = readAgentFunContract(networkKey);
  if (!contract) return [];
  try {
    let ids: bigint[];
    try {
      ids = await contract.getTaskIds(0, 100);
    } catch { ids = []; }
    const tasks = await Promise.all(ids.map(async (id) => {
      const task = await contract.getTask(id);
      return {
        id: task.id.toString(),
        agentId: task.agentId.toString(),
        requester: task.requester,
        executor: task.executor,
        fee: ethers.formatEther(task.fee),
        computeBudget: ethers.formatEther(task.computeBudget),
        actualComputeCost: ethers.formatEther(task.actualComputeCost),
        status: Number(task.status),
        createdAt: task.createdAt.toString(),
        deadline: task.deadline.toString(),
        promptRoot: String(task.promptRoot),
        resultRoot: String(task.resultRoot),
        computeHash: String(task.computeHash),
        completedAt: task.completedAt.toString(),
        rating: Number(task.rating)
      } satisfies TaskView;
    }));
    return tasks.reverse();
  } catch (error) {
    console.warn("Unable to load Agent.fun tasks from 0G Chain", error);
    return [];
  }
}

export function getAgentMarketStats(agents: AgentView[]) {
  return {
    liveAgents: agents.length,
    activeAgents: agents.filter((agent) => agent.active).length,
    totalTasks: agents.reduce((sum, agent) => sum + Number(agent.taskCount), 0),
    totalRevenue: agents.reduce((sum, agent) => sum + Number(agent.totalRevenue), 0),
    totalMarketCap: agents.reduce((sum, agent) => sum + Number(agent.marketCap), 0)
  };
}

export interface EconomyView {
  agentsLaunched: number;
  activatedAgents: number;
  completedTasks: number;
  uniquePayingUsers: number;
  creatorPayouts: number;
  protocolClaimable: number;
  computeClaimable: number;
  recordedComputeSpend: number;
  averageRevenuePerActiveAgent: number;
  taskSuccessRate: number;
  treasuryRunwayTasks: number;
}

export async function loadEconomyFromChain(
  agents: AgentView[],
  tasks: TaskView[],
  networkKey: ZeroGNetworkKey = "mainnet"
): Promise<EconomyView> {
  const completed = tasks.filter((task) => task.status === 3);
  const refunded = tasks.filter((task) => task.status === 4);
  const settled = completed.length + refunded.length;
  const activatedAgents = agents.filter((agent) => agent.computeActive).length;
  const creatorPayouts = agents.reduce((sum, agent) => sum + Number(agent.totalRevenue), 0);
  const recordedComputeSpend = completed.reduce((sum, task) => sum + Number(task.actualComputeCost), 0);
  let protocolClaimable = 0;
  let computeClaimable = 0;
  const contract = readAgentFunContract(networkKey);
  if (contract) {
    try {
      const [protocol, compute] = await Promise.all([contract.protocolClaimable(), contract.computeClaimable()]);
      protocolClaimable = Number(ethers.formatEther(protocol));
      computeClaimable = Number(ethers.formatEther(compute));
    } catch (error) {
      console.warn("Unable to load Agent.fun treasury balances from 0G Chain", error);
    }
  }
  const averageComputeCost = completed.length ? recordedComputeSpend / completed.length : 0;
  return {
    agentsLaunched: agents.length,
    activatedAgents,
    completedTasks: completed.length,
    uniquePayingUsers: new Set(completed.map((task) => task.requester.toLowerCase())).size,
    creatorPayouts,
    protocolClaimable,
    computeClaimable,
    recordedComputeSpend,
    averageRevenuePerActiveAgent: activatedAgents ? creatorPayouts / activatedAgents : 0,
    taskSuccessRate: settled ? (completed.length / settled) * 100 : 0,
    treasuryRunwayTasks: averageComputeCost ? computeClaimable / averageComputeCost : 0
  };
}
