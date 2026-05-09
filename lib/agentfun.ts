import { Contract, JsonRpcProvider, ethers } from "ethers";
import { agentFunCoreAbi } from "@shared/index";
import { clientConfig } from "./config";

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
  createdAt: string;
  active: boolean;
  taskCount: string;
  totalRevenue: string;
  keySupply: string;
  reserve: string;
}

export function readProvider() {
  return new JsonRpcProvider(clientConfig.rpcUrl, clientConfig.chainId);
}

export function readAgentFunContract() {
  if (!/^0x[a-fA-F0-9]{40}$/.test(clientConfig.agentFunCoreAddress)) return null;
  return new Contract(clientConfig.agentFunCoreAddress, agentFunCoreAbi, readProvider());
}

export async function loadAgentsFromChain(): Promise<AgentView[]> {
  const contract = readAgentFunContract();
  if (!contract) return [];
  try {
    const ids: bigint[] = await contract.getAllAgentIds();
    const agents = await Promise.all(ids.map(async (id) => {
      const agent = await contract.getAgent(id);
      const keySupply = await contract.keySupply(id);
      const reserve = await contract.agentReserve(id);
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
        createdAt: agent.createdAt.toString(),
        active: agent.active,
        taskCount: agent.taskCount.toString(),
        totalRevenue: ethers.formatEther(agent.totalRevenue),
        keySupply: keySupply.toString(),
        reserve: ethers.formatEther(reserve)
      } satisfies AgentView;
    }));
    return agents.reverse();
  } catch (error) {
    console.warn("Unable to load Agent.fun agents from 0G Chain", error);
    return [];
  }
}
