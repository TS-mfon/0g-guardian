import { Contract, JsonRpcProvider, Wallet } from "ethers";
import { agentFunCoreAbi } from "@shared/index";
import { getZeroGNetwork, isAddressConfigured } from "./config";

export function getExecutorPrivateKey() {
  return (
    process.env.EXECUTOR_PRIVATE_KEY ??
    process.env.SERVER_WALLET_PRIVATE_KEY ??
    ""
  ).trim();
}

export function getExecutorWallet() {
  const privateKey = getExecutorPrivateKey();
  if (!privateKey) throw new Error("EXECUTOR_PRIVATE_KEY is not configured.");
  const network = getZeroGNetwork();
  return new Wallet(privateKey, new JsonRpcProvider(network.rpcUrl, network.chainId));
}

export function getExecutorContract() {
  const network = getZeroGNetwork();
  if (!isAddressConfigured(network.agentFunCoreAddress)) throw new Error("Agent.fun contract is not configured.");
  return new Contract(network.agentFunCoreAddress, agentFunCoreAbi, getExecutorWallet());
}
