import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { agentFunCoreAbi } from "../packages/shared/src";
import { computeModelMatrix } from "../lib/compute-models";

for (const file of ["/home/sudodave/buildenv/.env", ".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index < 1 || line.trim().startsWith("#")) continue;
    process.env[line.slice(0, index).trim()] ??= line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
}

const rpc = process.env.ZERO_G_RPC_URL ?? "https://rpc.ankr.com/0g_mainnet_evm";
const chainId = 16661;
const address = process.env.MAINNET_V2_CORE;
const privateKey = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATEKEY ?? process.env.PRIVATE_KEY;
if (!address || !privateKey) throw new Error("Set the V2 core address and deployment key.");
const wallet = new ethers.Wallet(privateKey, new ethers.JsonRpcProvider(rpc, chainId));
const contract = new ethers.Contract(address, agentFunCoreAbi, wallet);

async function main() {
  for (const model of [...new Set(computeModelMatrix.map(({ model }) => model.id))]) {
    const hash = ethers.keccak256(ethers.toUtf8Bytes(model));
    if (await contract.approvedModels(hash)) continue;
    const tx = await contract.setModelApproval(hash, true);
    await tx.wait();
    console.log(`Approved ${model}: ${tx.hash}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
