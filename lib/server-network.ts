import { ZeroGNetworkKey } from "./config";

export async function getServerNetwork(): Promise<ZeroGNetworkKey> {
  return "mainnet";
}
