import { ZERO_G_GALILEO, ZERO_G_MAINNET } from "@shared/index";

export const zeroGNetworks = {
  mainnet: {
    key: "mainnet",
    label: "0G Mainnet",
    ...ZERO_G_MAINNET
  },
  testnet: {
    key: "testnet",
    label: "0G Galileo",
    ...ZERO_G_GALILEO
  }
} as const;

export type ZeroGNetworkKey = keyof typeof zeroGNetworks;

export const clientConfig = {
  chainId: Number(process.env.NEXT_PUBLIC_0G_CHAIN_ID ?? ZERO_G_MAINNET.chainId),
  chainIdHex: process.env.NEXT_PUBLIC_0G_CHAIN_ID_HEX ?? ZERO_G_MAINNET.chainIdHex,
  rpcUrl: process.env.NEXT_PUBLIC_0G_RPC_URL ?? ZERO_G_MAINNET.rpcUrl,
  storageIndexer: process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER ?? ZERO_G_MAINNET.storageIndexer,
  explorerUrl: process.env.NEXT_PUBLIC_0G_EXPLORER ?? ZERO_G_MAINNET.explorerUrl,
  storageScanUrl: process.env.NEXT_PUBLIC_0G_STORAGE_SCAN ?? ZERO_G_MAINNET.storageScanUrl,
  agentFunCoreAddress: process.env.NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS ?? "",
  agentIdContractAddress: process.env.NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS ?? "",
  daGatewayUrl: process.env.NEXT_PUBLIC_DA_GATEWAY_URL ?? "",
  computeBaseUrl: process.env.NEXT_PUBLIC_0G_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1",
  computeModel: process.env.NEXT_PUBLIC_0G_COMPUTE_MODEL ?? "qwen/qwen-2.5-7b-instruct"
};

export function isAddressConfigured(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function getZeroGNetwork(key: ZeroGNetworkKey) {
  return zeroGNetworks[key];
}
