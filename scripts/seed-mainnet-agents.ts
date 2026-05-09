import { existsSync, readFileSync } from "node:fs";
import { ethers } from "ethers";
import { genesisTemplates } from "../lib/agent-templates";
import { agentFunCoreAbi, agenticIdAbi } from "../packages/shared/src";

for (const file of [".envvv", ".env.local", ".env", "deployment.env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const index = trimmed.indexOf("=");
    const privateKeyIndex = trimmed.toLowerCase().indexOf("private key:");
    if (index === -1 && privateKeyIndex === -1) continue;
    const key = privateKeyIndex === 0 ? "PRIVATE_KEY" : trimmed.slice(0, index).trim();
    const value = privateKeyIndex === 0
      ? trimmed.slice("private key:".length).trim().replace(/^['"]|['"]$/g, "")
      : trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
    process.env[key] ??= value;
  }
}

const rpcUrl = process.env.ZERO_G_RPC_URL ?? process.env.NEXT_PUBLIC_0G_RPC_URL ?? "https://rpc.ankr.com/0g_mainnet_evm";
const privateKey = process.env.DEPLOYER_PRIVATE_KEY ?? process.env.PRIVATE_KEY;
const coreAddress = process.env.NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS;
const agentIdAddress = process.env.NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS;

if (!privateKey) throw new Error("DEPLOYER_PRIVATE_KEY or PRIVATE_KEY must be set locally.");
if (!coreAddress) throw new Error("NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS must be set.");
if (!agentIdAddress) throw new Error("NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS must be set.");

const provider = new ethers.JsonRpcProvider(rpcUrl, 16661);
const wallet = new ethers.Wallet(privateKey, provider);
const core = new ethers.Contract(coreAddress, agentFunCoreAbi, wallet);
const agentId = new ethers.Contract(agentIdAddress, agenticIdAbi, wallet);

function root(label: string, payload: unknown) {
  return ethers.keccak256(ethers.toUtf8Bytes(`${label}:${JSON.stringify(payload)}`));
}

async function main() {
  const network = await provider.getNetwork();
  if (Number(network.chainId) !== 16661) throw new Error(`Expected 0G Mainnet 16661, got ${network.chainId}.`);

  const nextAgentId = Number(await core.nextAgentId());
  if (nextAgentId > genesisTemplates.length) {
    console.log(`Seed skipped: nextAgentId is ${nextAgentId}, genesis agents already exist.`);
    return;
  }

  const launchFee = await core.launchFee();
  const launched: Array<{ id: string; tokenId: string; name: string; tx: string }> = [];

  for (const template of genesisTemplates.slice(nextAgentId - 1)) {
    const metadata = {
      app: "agent.fun",
      name: template.name,
      symbol: template.symbol,
      category: template.category,
      description: template.description,
      systemPrompt: template.systemPrompt,
      creator: wallet.address,
      createdFor: "0G mainnet live demo"
    };
    const metadataRoot = root("metadata", metadata);
    const memoryRoot = root("memory", {
      agent: template.name,
      summary: `${template.name} launched with persistent 0G memory root.`,
      facts: [template.description]
    });
    const capabilityHash = root("capability", {
      category: template.category,
      prompt: template.systemPrompt
    });

    const mintTx = await agentId.mint(wallet.address, `0g://agent.fun/${template.symbol.toLowerCase()}`, metadataRoot);
    const mintReceipt = await mintTx.wait();
    const tokenId = Number(await agentId.nextTokenId()) - 1;

    const launchTx = await core.launchAgent(
      template.name,
      template.symbol,
      template.category,
      tokenId,
      metadataRoot,
      memoryRoot,
      capabilityHash,
      { value: launchFee }
    );
    const receipt = await launchTx.wait();
    const agentIdNumber = Number(await core.nextAgentId()) - 1;
    launched.push({
      id: String(agentIdNumber),
      tokenId: String(tokenId),
      name: template.name,
      tx: receipt?.hash ?? launchTx.hash
    });
    console.log(`Launched ${template.name} with Agent ID ${tokenId}. Mint tx: ${mintReceipt?.hash ?? mintTx.hash}`);
  }

  console.log(JSON.stringify({ ok: true, coreAddress, agentIdAddress, launched }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
