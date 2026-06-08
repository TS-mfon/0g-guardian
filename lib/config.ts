import { ZERO_G_MAINNET } from "@shared/index";

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
  }
} as const;

export type ZeroGNetworkKey = "mainnet";
export type ZeroGRuntimeNetwork = typeof zeroGNetworks["mainnet"];

export const clientConfig = {
  chainId: zeroGNetworks.mainnet.chainId,
  chainIdHex: zeroGNetworks.mainnet.chainIdHex,
  rpcUrl: zeroGNetworks.mainnet.rpcUrl,
  storageIndexer: zeroGNetworks.mainnet.storageIndexer,
  explorerUrl: zeroGNetworks.mainnet.explorerUrl,
  storageScanUrl: zeroGNetworks.mainnet.storageScanUrl,
  agentFunCoreAddress: zeroGNetworks.mainnet.agentFunCoreAddress,
  agentIdContractAddress: zeroGNetworks.mainnet.agentIdContractAddress,
  computeBaseUrl: process.env.NEXT_PUBLIC_0G_COMPUTE_BASE_URL ?? "https://router-api.0g.ai/v1",
  computeModel: process.env.NEXT_PUBLIC_0G_COMPUTE_MODEL ?? "zai-org/GLM-5-FP8",
  protocolFeeWallet: process.env.NEXT_PUBLIC_PROTOCOL_FEE_WALLET ?? "0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E"
};

export function isAddressConfigured(address: string) {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

export function getZeroGNetwork(_key: ZeroGNetworkKey = "mainnet") {
  return zeroGNetworks.mainnet;
}
