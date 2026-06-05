import { ZERO_G_GALILEO, ZERO_G_MAINNET } from "@shared/index";

export const zeroGNetworks = {
  mainnet: {
    key: "mainnet",
    label: "0G Mainnet",
    ...ZERO_G_MAINNET,
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_0G_RPC_URL ?? process.env.NEXT_PUBLIC_0G_RPC_URL ?? ZERO_G_MAINNET.rpcUrl,
    storageIndexer: process.env.NEXT_PUBLIC_MAINNET_0G_STORAGE_INDEXER ?? process.env.NEXT_PUBLIC_0G_STORAGE_INDEXER ?? ZERO_G_MAINNET.storageIndexer,
    explorerUrl: process.env.NEXT_PUBLIC_MAINNET_0G_EXPLORER ?? process.env.NEXT_PUBLIC_0G_EXPLORER ?? ZERO_G_MAINNET.explorerUrl,
    storageScanUrl: process.env.NEXT_PUBLIC_MAINNET_0G_STORAGE_SCAN ?? process.env.NEXT_PUBLIC_0G_STORAGE_SCAN ?? ZERO_G_MAINNET.storageScanUrl,
    agentFunCoreAddress: process.env.NEXT_PUBLIC_MAINNET_AGENT_FUN_CORE_ADDRESS ?? process.env.NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS ?? "",
    agentIdContractAddress: process.env.NEXT_PUBLIC_MAINNET_AGENT_ID_CONTRACT_ADDRESS ?? process.env.NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS ?? ""
  },
  testnet: {
    key: "testnet",
    label: "0G Galileo",
    ...ZERO_G_GALILEO,
    rpcUrl: process.env.NEXT_PUBLIC_TESTNET_0G_RPC_URL ?? ZERO_G_GALILEO.rpcUrl,
    storageIndexer: process.env.NEXT_PUBLIC_TESTNET_0G_STORAGE_INDEXER ?? ZERO_G_GALILEO.storageIndexer,
    explorerUrl: process.env.NEXT_PUBLIC_TESTNET_0G_EXPLORER ?? ZERO_G_GALILEO.explorerUrl,
    storageScanUrl: process.env.NEXT_PUBLIC_TESTNET_0G_STORAGE_SCAN ?? ZERO_G_GALILEO.storageScanUrl,
    agentFunCoreAddress: process.env.NEXT_PUBLIC_TESTNET_AGENT_FUN_CORE_ADDRESS ?? "",
    agentIdContractAddress: process.env.NEXT_PUBLIC_TESTNET_AGENT_ID_CONTRACT_ADDRESS ?? ""
  }
} as const;

export type ZeroGNetworkKey = keyof typeof zeroGNetworks;
export type ZeroGRuntimeNetwork = typeof zeroGNetworks[ZeroGNetworkKey];

export const clientConfig = {
  chainId: zeroGNetworks.mainnet.chainId,
  chainIdHex: zeroGNetworks.mainnet.chainIdHex,
  rpcUrl: zeroGNetworks.mainnet.rpcUrl,
  storageIndexer: zeroGNetworks.mainnet.storageIndexer,
  explorerUrl: zeroGNetworks.mainnet.explorerUrl,
  storageScanUrl: zeroGNetworks.mainnet.storageScanUrl,
  agentFunCoreAddress: zeroGNetworks.mainnet.agentFunCoreAddress,
  agentIdContractAddress: zeroGNetworks.mainnet.agentIdContractAddress,
  daGatewayUrl: process.env.NEXT_PUBLIC_DA_GATEWAY_URL ?? "",
  computeBaseUrl: process.env.NEXT_PUBLIC_0G_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1",
  computeModel: process.env.NEXT_PUBLIC_0G_COMPUTE_MODEL ?? "zai-org/GLM-5-FP8",
  directComputeProvider: process.env.NEXT_PUBLIC_0G_DIRECT_PROVIDER ?? "0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C",
  protocolFeeWallet: process.env.NEXT_PUBLIC_PROTOCOL_FEE_WALLET ?? "0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E"
};

export function isAddressConfigured(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function getZeroGNetwork(key: ZeroGNetworkKey) {
  return zeroGNetworks[key];
}

export function getNetworkByChainId(chainId: number): ZeroGNetworkKey {
  return chainId === zeroGNetworks.testnet.chainId ? "testnet" : "mainnet";
}
