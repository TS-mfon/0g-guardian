import { NextResponse } from "next/server";
import { JsonRpcProvider } from "ethers";
import { getZeroGNetwork, isAddressConfigured } from "@/lib/config";

async function checkUrl(url: string) {
  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(8_000) });
    return response.ok || response.status < 500;
  } catch {
    return false;
  }
}

export async function GET() {
  const network = getZeroGNetwork();
  const provider = new JsonRpcProvider(network.rpcUrl, network.chainId);
  let rpc = false;
  let core = false;
  let agentId = false;
  try {
    const actualChain = await provider.getNetwork();
    rpc = Number(actualChain.chainId) === network.chainId;
    if (rpc && isAddressConfigured(network.agentFunCoreAddress) && isAddressConfigured(network.agentIdContractAddress)) {
      const [coreCode, agentIdCode] = await Promise.all([
        provider.getCode(network.agentFunCoreAddress),
        provider.getCode(network.agentIdContractAddress)
      ]);
      core = coreCode !== "0x";
      agentId = agentIdCode !== "0x";
    }
  } catch {
    rpc = false;
  }
  const storage = await checkUrl(network.storageIndexer);
  const compute = Boolean(process.env.OG_COMPUTE_KEY);
  return NextResponse.json({
    network: "mainnet",
    ready: rpc && core && agentId && storage,
    taskReady: rpc && core && agentId && storage && compute && Boolean(process.env.EXECUTOR_PRIVATE_KEY || process.env.SERVER_WALLET_PRIVATE_KEY),
    checks: { rpc, core, agentId, storage, compute }
  });
}
