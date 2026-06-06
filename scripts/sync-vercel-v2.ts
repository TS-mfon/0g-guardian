import { readFileSync } from "node:fs";

function parseEnv(path: string) {
  const output: Record<string, string> = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const index = line.indexOf("=");
    if (index < 1 || line.trim().startsWith("#")) continue;
    output[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^['"]|['"]$/g, "");
  }
  return output;
}

const credentials = parseEnv("/home/sudodave/buildenv/.env");
const deployment = parseEnv("deployment.env");
const project = JSON.parse(readFileSync(".vercel/project.json", "utf8"));
const token = credentials.VERCEL_TOKEN;
if (!token) throw new Error("VERCEL_TOKEN is missing.");

const env: Record<string, string> = {
  ...Object.fromEntries(Object.entries(deployment).filter(([key]) => key.startsWith("NEXT_PUBLIC_"))),
  SERVER_WALLET_PRIVATE_KEY: credentials.DEPLOYER_PRIVATEKEY,
  EXECUTOR_PRIVATE_KEY: credentials.DEPLOYER_PRIVATEKEY,
  OG_COMPUTE_BASE_URL: "https://router-api.0g.ai/v1",
  OG_DEMO_MODE: "false"
};

async function main() {
  for (const [key, value] of Object.entries(env)) {
    if (!value) continue;
    const response = await fetch(
      `https://api.vercel.com/v10/projects/${project.projectId}/env?teamId=${project.orgId}&upsert=true`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ key, value, type: "encrypted", target: ["production", "preview"] })
      }
    );
    if (!response.ok) throw new Error(`${key}: ${response.status} ${await response.text()}`);
    console.log(`Synced ${key}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
