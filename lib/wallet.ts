import { BrowserProvider, Contract, ethers } from "ethers";
import { agentFunCoreAbi, agenticIdAbi } from "@shared/index";
import { clientConfig, getZeroGNetwork, ZeroGNetworkKey, zeroGNetworks } from "./config";

declare global {
  interface Window {
    ethereum?: ethers.Eip1193Provider;
  }
}

export async function getBrowserProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("No injected wallet found. Install a wallet that supports custom EVM networks.");
  }
  return new BrowserProvider(window.ethereum);
}

export async function connectWallet() {
  const provider = await getBrowserProvider();
  await provider.send("eth_requestAccounts", []);
  await ensureZeroGNetwork(provider);
  const signer = await provider.getSigner();
  const address = await signer.getAddress();
  rememberWallet(address);
  return { provider, signer, address };
}

export async function getConnectedWallet() {
  const provider = await getBrowserProvider();
  const accounts = await provider.send("eth_accounts", []);
  const address = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";
  if (!address) return { provider, address: "", balance: "" };
  await ensureZeroGNetwork(provider);
  const rawBalance = await provider.getBalance(address);
  rememberWallet(address);
  return { provider, address, balance: ethers.formatEther(rawBalance) };
}

export function rememberWallet(address: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("agentfun.walletConnected", "true");
  window.localStorage.setItem("agentfun.walletAddress", address);
  window.dispatchEvent(new CustomEvent("agentfun:wallet", { detail: { address } }));
}

export function forgetWallet() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem("agentfun.walletConnected");
  window.localStorage.removeItem("agentfun.walletAddress");
  window.dispatchEvent(new CustomEvent("agentfun:wallet", { detail: { address: "" } }));
}

export function wantsWalletReconnect() {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem("agentfun.walletConnected") === "true";
}

export function getSelectedNetworkKey(): ZeroGNetworkKey {
  if (typeof window === "undefined") return "mainnet";
  const value = window.localStorage.getItem("agentfun.network");
  return value === "testnet" ? "testnet" : "mainnet";
}

export function setSelectedNetworkKey(key: ZeroGNetworkKey) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("agentfun.network", key);
  window.dispatchEvent(new CustomEvent("agentfun:network", { detail: { key } }));
}

export async function ensureZeroGNetwork(provider: BrowserProvider) {
  const selected = getZeroGNetwork(getSelectedNetworkKey());
  const network = await provider.getNetwork();
  if (Number(network.chainId) === selected.chainId) return;
  try {
    await provider.send("wallet_switchEthereumChain", [{ chainId: selected.chainIdHex }]);
  } catch {
    await provider.send("wallet_addEthereumChain", [
      {
        chainId: selected.chainIdHex,
        chainName: selected.label,
        nativeCurrency: { name: "0G", symbol: "0G", decimals: 18 },
        rpcUrls: [selected.rpcUrl],
        blockExplorerUrls: [selected.explorerUrl]
      }
    ]);
  }
}

export function getSelectedNetworkLabel() {
  return zeroGNetworks[getSelectedNetworkKey()].label;
}

export async function agentFunCoreContract() {
  const { signer } = await connectWallet();
  return new Contract(clientConfig.agentFunCoreAddress, agentFunCoreAbi, signer);
}

export async function agentIdContract() {
  const { signer } = await connectWallet();
  return new Contract(clientConfig.agentIdContractAddress, agenticIdAbi, signer);
}
