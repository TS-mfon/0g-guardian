import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { ContractFactory, ethers } from "ethers";
import { computeModelMatrix } from "../lib/compute-models";

for (const file of ["/home/sudodave/buildenv/.env", ".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index < 1 || line.trim().startsWith("#")) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

const network = { chainId: 16661, rpc: process.env.ZERO_G_RPC_URL ?? "https://rpc.ankr.com/0g_mainnet_evm", prefix: "MAINNET" };
const privateKey = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.DEPLOYER_PRIVATEKEY ?? process.env.PRIVATE_KEY;
const protocolTreasury = process.env.PROTOCOL_TREASURY ?? "0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E";
const computeTreasury = process.env.COMPUTE_TREASURY ?? protocolTreasury;
if (!privateKey) throw new Error("Deployment private key is not configured.");

const provider = new ethers.JsonRpcProvider(network.rpc, network.chainId);
const wallet = new ethers.Wallet(privateKey, provider);

function artifact(name: string) {
  return JSON.parse(readFileSync(resolve(`contracts/out/${name}.sol/${name}.json`), "utf8"));
}

async function deploy(name: string, args: unknown[] = []) {
  const compiled = artifact(name);
  const factory = new ContractFactory(compiled.abi, compiled.bytecode.object, wallet);
  const contract = await factory.deploy(...args);
  const receipt = await contract.deploymentTransaction()?.wait();
  if (!receipt) throw new Error(`${name} deployment receipt missing.`);
  return { contract, address: await contract.getAddress(), txHash: receipt.hash, blockNumber: receipt.blockNumber };
}

async function main() {
  if (Number((await provider.getNetwork()).chainId) !== network.chainId) throw new Error("RPC chain ID mismatch.");
  const balance = await provider.getBalance(wallet.address);
  if (balance === 0n) throw new Error(`Deployer ${wallet.address} has no 0G.`);

  const identity = await deploy("MockAgentId");
  const core = await deploy("AgentFunCoreV2", [identity.address, protocolTreasury, computeTreasury]);
  const models = [...new Set(computeModelMatrix.map(({ model }) => model.id))];
  for (const model of models) {
    const tx = await (core.contract as any).setModelApproval(ethers.keccak256(ethers.toUtf8Bytes(model)), true);
    await tx.wait();
  }

  const output = [
    `NEXT_PUBLIC_${network.prefix}_AGENT_FUN_CORE_ADDRESS=${core.address}`,
    `NEXT_PUBLIC_${network.prefix}_AGENT_ID_CONTRACT_ADDRESS=${identity.address}`,
    `${network.prefix}_AGENT_FUN_CORE_DEPLOY_TX=${core.txHash}`,
    `${network.prefix}_AGENT_ID_DEPLOY_TX=${identity.txHash}`,
    `${network.prefix}_V2_DEPLOYMENT_BLOCK=${Math.min(core.blockNumber, identity.blockNumber)}`
  ].join("\n");
  writeFileSync(`deployment-v2-mainnet.env`, `${output}\n`);
  console.log(output);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
