import { Wallet, JsonRpcProvider } from "ethers";
import { clientConfig } from "./config";

export interface ServerStorageResult {
  rootHash: string;
  txHash?: string;
  sizeBytes: number;
  mode: "0g-storage";
}

export async function uploadBytesTo0GFromServer(encoded: Uint8Array): Promise<ServerStorageResult> {
  const privateKey = process.env.SERVER_WALLET_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error("SERVER_WALLET_PRIVATE_KEY is not configured.");
  const sdk = (await import("@0gfoundation/0g-storage-ts-sdk")) as any;
  const signer = new Wallet(privateKey, new JsonRpcProvider(clientConfig.rpcUrl, clientConfig.chainId));
  const memData = new sdk.MemData(encoded);
  const [tree, treeErr] = await memData.merkleTree();
  if (treeErr !== null) throw new Error(`0G Storage Merkle error: ${treeErr}`);
  const indexer = new sdk.Indexer(clientConfig.storageIndexer);
  const [tx, uploadErr] = await indexer.upload(memData, clientConfig.rpcUrl, signer);
  if (uploadErr !== null) throw new Error(`0G Storage upload error: ${uploadErr}`);
  const rootHash = tx?.rootHash ?? tree?.rootHash?.();
  if (!rootHash) throw new Error("0G Storage upload completed without a root hash.");
  return { rootHash: String(rootHash), txHash: tx?.txHash ? String(tx.txHash) : undefined, sizeBytes: encoded.byteLength, mode: "0g-storage" };
}
