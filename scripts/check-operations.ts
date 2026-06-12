import { ethers, JsonRpcProvider, Wallet, Contract } from "ethers";
import { createZGComputeNetworkBroker } from "@0gfoundation/0g-compute-ts-sdk";
import { agentFunCoreAbi } from "../packages/shared/src";

const rpcUrl = process.env.NEXT_PUBLIC_0G_RPC_URL ?? "https://evmrpc.0g.ai";
const coreAddress = process.env.NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS ?? process.env.NEXT_PUBLIC_MAINNET_AGENT_FUN_CORE_ADDRESS ?? "";
const privateKey = process.env.EXECUTOR_PRIVATE_KEY ?? process.env.SERVER_WALLET_PRIVATE_KEY ?? "";
if (!privateKey || !coreAddress) throw new Error("EXECUTOR_PRIVATE_KEY and NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS are required.");

const provider = new JsonRpcProvider(rpcUrl, 16661);
const wallet = new Wallet(privateKey, provider);
const core = new Contract(coreAddress, agentFunCoreAbi, provider);
const broker = await createZGComputeNetworkBroker(wallet);
const [ledger, providers, gas, authorized, modelsResponse] = await Promise.all([
  broker.ledger.getLedger(),
  broker.ledger.getProvidersWithBalance("inference"),
  provider.getBalance(wallet.address),
  core.taskExecutors(wallet.address),
  fetch(`${(process.env.OG_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1").replace(/\/$/, "")}/models`, {
    headers: process.env.OG_COMPUTE_KEY ? { authorization: `Bearer ${process.env.OG_COMPUTE_KEY}` } : {}
  })
]);
const models = modelsResponse.ok ? await modelsResponse.json() : null;
const providerBalance = providers.reduce((sum, [, balance]) => sum + balance, 0n);
const lowGas = gas < ethers.parseEther("0.01");
const lowRouter = ledger.availableBalance <= 0n || providerBalance <= 0n;

console.log(JSON.stringify({
  checkedAt: new Date().toISOString(),
  executor: wallet.address,
  executorAuthorized: Boolean(authorized),
  executorGas: ethers.formatEther(gas),
  routerAvailableBalance: ledger.availableBalance.toString(),
  routerTotalBalance: ledger.totalBalance.toString(),
  providerSubAccountBalance: providerBalance.toString(),
  providerSubAccounts: providers.length,
  modelHealth: modelsResponse.ok && Array.isArray(models?.data) && models.data.length > 0,
  warnings: [
    ...(!authorized ? ["Executor is not authorized by AgentFunCoreV2."] : []),
    ...(lowGas ? ["Executor gas is below 0.01 0G."] : []),
    ...(lowRouter ? ["Router ledger or provider sub-account needs funding."] : [])
  ]
}, null, 2));
