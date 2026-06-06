import { cookies } from "next/headers";
import { ZeroGNetworkKey } from "./config";

export async function getServerNetwork(): Promise<ZeroGNetworkKey> {
  const store = await cookies();
  return store.get("agentfun.network")?.value === "testnet" ? "testnet" : "mainnet";
}
