import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";

interface StoredComputeKey {
  agentId: string;
  network: string;
  creator: string;
  encryptedKey: string;
  iv: string;
  tag: string;
  provider: string;
  baseUrl: string;
  model: string;
  updatedAt: string;
}

type StoreShape = Record<string, StoredComputeKey>;

function dataDir() {
  return process.env.AGENTFUN_DATA_DIR ?? path.join(process.cwd(), ".agentfun-data");
}

function storePath() {
  return path.join(dataDir(), "creator-compute-keys.json");
}

function encryptionSecret() {
  const secret = (
    process.env.AGENTFUN_CREDENTIAL_SECRET ??
    process.env.SERVER_WALLET_PRIVATE_KEY ??
    process.env.EXECUTOR_PRIVATE_KEY ??
    process.env.DEPLOYER_PRIVATE_KEY ??
    process.env.PRIVATE_KEY ??
    ""
  ).trim();
  if (!secret) throw new Error("Credential encryption secret is not configured.");
  return createHash("sha256").update(secret).digest();
}

async function readStore(): Promise<StoreShape> {
  try {
    const raw = await readFile(storePath(), "utf8");
    return JSON.parse(raw) as StoreShape;
  } catch {
    return {};
  }
}

async function writeStore(store: StoreShape) {
  await mkdir(dataDir(), { recursive: true });
  await writeFile(storePath(), JSON.stringify(store, null, 2), { mode: 0o600 });
}

function normalizeAgentKey(agentId: string, network = "mainnet") {
  return `${network}:${String(BigInt(agentId))}`;
}

export function isValid0GComputeApiKey(value: string) {
  return /^(sk|app-sk)-[A-Za-z0-9._-]{12,}$/.test(value.trim());
}

export async function saveCreatorComputeKey(input: {
  agentId: string;
  network?: string;
  creator: string;
  apiKey: string;
  baseUrl: string;
  model: string;
  provider?: string;
}) {
  const apiKey = input.apiKey.trim();
  if (!isValid0GComputeApiKey(apiKey)) {
    throw new Error("Enter a real 0G Compute key starting with sk- or app-sk-.");
  }

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionSecret(), iv);
  const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const store = await readStore();
  const agentId = String(BigInt(input.agentId));
  const network = input.network ?? "mainnet";
  store[normalizeAgentKey(agentId, network)] = {
    agentId,
    network,
    creator: input.creator.toLowerCase(),
    encryptedKey: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
    provider: input.provider ?? "0G Compute",
    baseUrl: input.baseUrl,
    model: input.model,
    updatedAt: new Date().toISOString()
  };
  await writeStore(store);
}

export async function getCreatorComputeStatus(agentId: string) {
  return getCreatorComputeStatusForNetwork(agentId, "mainnet");
}

export async function getCreatorComputeStatusForNetwork(agentId: string, network = "mainnet") {
  const store = await readStore();
  const legacyKey = String(BigInt(agentId));
  const item = store[normalizeAgentKey(agentId, network)] ?? store[normalizeAgentKey(agentId, "mainnet")] ?? store[legacyKey];
  if (!item) return { configured: false as const };
  return {
    configured: true as const,
    provider: item.provider,
    baseUrl: item.baseUrl,
    model: item.model,
    updatedAt: item.updatedAt
  };
}

export async function loadCreatorComputeKey(agentId: string) {
  return loadCreatorComputeKeyForNetwork(agentId, "mainnet");
}

export async function loadCreatorComputeKeyForNetwork(agentId: string, network = "mainnet") {
  const store = await readStore();
  const legacyKey = String(BigInt(agentId));
  const item = store[normalizeAgentKey(agentId, network)] ?? store[normalizeAgentKey(agentId, "mainnet")] ?? store[legacyKey];
  if (!item) throw new Error("The creator has not linked a 0G Compute key for this agent yet.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionSecret(), Buffer.from(item.iv, "base64"));
  decipher.setAuthTag(Buffer.from(item.tag, "base64"));
  const apiKey = Buffer.concat([
    decipher.update(Buffer.from(item.encryptedKey, "base64")),
    decipher.final()
  ]).toString("utf8");
  return { ...item, apiKey };
}
