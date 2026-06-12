import { Contract, JsonRpcProvider, Wallet, ethers } from "ethers";
import { agentFunCoreAbi } from "@shared/index";
import { getExecutorPrivateKey } from "./executor";
import { getZeroGNetwork, isAddressConfigured } from "./config";

export interface ReadinessCheck {
  ok: boolean;
  message: string;
  checkedAt: string;
  value?: string;
}

export interface TaskReadiness {
  taskReady: boolean;
  checkedAt: string;
  lastSuccessfulCheckAt: string | null;
  checks: {
    rpc: ReadinessCheck;
    coreContract: ReadinessCheck;
    storage: ReadinessCheck;
    routerCredential: ReadinessCheck;
    routerBalance: ReadinessCheck;
    executorConfigured: ReadinessCheck;
    executorAuthorized: ReadinessCheck;
    executorGas: ReadinessCheck;
    modelProvider: ReadinessCheck;
  };
}

let lastSuccessfulCheckAt: string | null = null;
const check = (ok: boolean, message: string, checkedAt: string, value?: string): ReadinessCheck => ({ ok, message, checkedAt, value });

async function urlCheck(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(8_000) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

export async function getTaskReadiness(): Promise<TaskReadiness> {
  const checkedAt = new Date().toISOString();
  const network = getZeroGNetwork();
  const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
  const privateKey = getExecutorPrivateKey();
  const executor = privateKey ? new Wallet(privateKey, provider) : null;
  let rpcOk = false;
  let coreOk = false;
  let executorAuthorized = false;
  let gasBalance = 0n;
  let routerBalance = 0n;

  try {
    rpcOk = Number((await provider.getNetwork()).chainId) === network.chainId;
    if (rpcOk && isAddressConfigured(network.agentFunCoreAddress)) {
      coreOk = (await provider.getCode(network.agentFunCoreAddress)) !== "0x";
      if (coreOk && executor) {
        const contract = new Contract(network.agentFunCoreAddress, agentFunCoreAbi, provider);
        [executorAuthorized, gasBalance] = await Promise.all([
          contract.taskExecutors(executor.address),
          provider.getBalance(executor.address)
        ]);
      }
    }
  } catch {
    rpcOk = false;
  }

  const storageOk = await urlCheck(network.storageIndexer);
  const credential = process.env.OG_COMPUTE_KEY?.trim() ?? "";
  let credentialOk = false;
  let modelProviderOk = false;
  try {
    if (credential) {
      const response = await fetch(`${(process.env.OG_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1").replace(/\/$/, "")}/models`, {
        headers: { authorization: `Bearer ${credential}` },
        cache: "no-store",
        signal: AbortSignal.timeout(8_000)
      });
      credentialOk = response.ok;
      const body = response.ok ? await response.json() : null;
      modelProviderOk = Array.isArray(body?.data) && body.data.some((model: { provider_count?: number; providers?: unknown[] }) =>
        (model.provider_count ?? 0) > 0 || (Array.isArray(model.providers) && model.providers.length > 0)
      );
    }
  } catch {
    credentialOk = false;
  }

  if (executor) {
    try {
      const { createZGComputeNetworkBroker } = await import("@0gfoundation/0g-compute-ts-sdk");
      const broker = await createZGComputeNetworkBroker(executor);
      const ledger = await broker.ledger.getLedger();
      routerBalance = BigInt((ledger as unknown as { availableBalance?: bigint; balance?: bigint }).availableBalance
        ?? (ledger as unknown as { balance?: bigint }).balance
        ?? 0n);
    } catch {
      routerBalance = 0n;
    }
  }

  const minimumGas = BigInt(process.env.MIN_EXECUTOR_GAS_WEI ?? ethers.parseEther("0.001"));
  const routerBalanceOk = routerBalance > 0n || process.env.OG_ROUTER_BALANCE_CONFIRMED === "true";
  const checks = {
    rpc: check(rpcOk, rpcOk ? "0G Mainnet RPC is reachable." : "0G Mainnet RPC is unavailable.", checkedAt),
    coreContract: check(coreOk, coreOk ? "Agent.fun core contract is deployed." : "Agent.fun core contract is unavailable.", checkedAt),
    storage: check(storageOk, storageOk ? "0G Storage indexer is reachable." : "0G Storage indexer is unavailable.", checkedAt),
    routerCredential: check(credentialOk, credentialOk ? "Router credential was accepted." : "Router credential is missing or rejected.", checkedAt),
    routerBalance: check(routerBalanceOk, routerBalanceOk ? "Router ledger funding is confirmed." : "Router ledger has no confirmed available balance.", checkedAt, routerBalance.toString()),
    executorConfigured: check(Boolean(executor), executor ? `Executor ${executor.address} is configured.` : "Executor private key is not configured.", checkedAt, executor?.address),
    executorAuthorized: check(executorAuthorized, executorAuthorized ? "Executor is authorized by AgentFunCoreV2." : "Executor is not authorized by AgentFunCoreV2.", checkedAt),
    executorGas: check(gasBalance >= minimumGas, gasBalance >= minimumGas ? "Executor has sufficient 0G gas." : "Executor gas balance is below the required minimum.", checkedAt, gasBalance.toString()),
    modelProvider: check(modelProviderOk, modelProviderOk ? "At least one live Router model provider is available." : "No live Router model provider was verified.", checkedAt)
  };
  const taskReady = Object.values(checks).every((item) => item.ok);
  if (taskReady) lastSuccessfulCheckAt = checkedAt;
  return { taskReady, checkedAt, lastSuccessfulCheckAt, checks };
}
