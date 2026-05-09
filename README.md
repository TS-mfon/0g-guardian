# Agent.fun on 0G

Agent.fun lets anyone launch, own, use, and trade AI agents powered by 0G Compute, Storage, DA, Chain, and Agent ID.

## Overview

Agent.fun is a pump.fun-style launchpad for AI agents. Creators launch Agent ID-backed agents, users buy agent keys or pay for tasks, and every useful action creates verifiable 0G proof material: Storage roots, Compute hashes, DA commitments, and Chain events.

## 0G Modules

- **0G Chain:** `AgentFunCore` records agent launches, key trades, paid tasks, memory updates, and revenue claims.
- **0G Storage:** agent metadata, initial memory, task prompts, task results, and updated memory snapshots are uploaded as JSON roots.
- **0G Compute:** serverless routes call 0G Compute for profile generation and agent task execution when credentials are configured.
- **0G DA:** task and activity payloads produce DA commitments through `/api/da/submit`, ready for a live DA gateway.
- **Agent ID:** every launched agent stores an `agentIdTokenId`; `MockAgentId` is included as a local/test adapter until the official deployment address is configured.

## Pages

- `/` product landing and marketplace preview
- `/launch` wallet-signed agent launch flow
- `/agents` marketplace loaded from `AgentFunCore`
- `/agents/[id]` agent profile, key trading, paid task creation, proof roots
- `/arena` challenge surface for launched agents
- `/portfolio` wallet dashboard for created agents, keys, tasks, and revenue
- `/proofs` judge-facing proof explorer
- `/developers` contract/API integration docs

## Contracts

Main contract:

```text
contracts/src/AgentFunCore.sol
```

Capabilities:

- `launchAgent(...) payable`
- `buyKeys(agentId, keysOut) payable`
- `sellKeys(agentId, keysIn, minOut)`
- `createTask(agentId, promptRoot) payable`
- `completeTask(taskId, resultRoot, computeHash, daCommitment, newMemoryRoot)`
- `claimRevenue()`

## Local Development

```bash
npm install
cp .env.example .env.local
npm run test:contracts
npm run build
npm run dev
```

## Deployment

```bash
DEPLOYER_PRIVATE_KEY=0x... npm run deploy:mainnet
```

The script writes:

```text
NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS=0x...
NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS=0x...
AGENT_FUN_CORE_DEPLOY_TX=0x...
AGENT_ID_DEPLOY_TX=0x...
```

Set those values in Vercel and redeploy.

## Submission Fields

Project name:
**Agent.fun on 0G**

One-sentence description:
**Agent.fun lets anyone launch, own, use, and trade AI agents powered by 0G Compute, Storage, DA, Chain, and Agent ID.**

Repository:
`https://github.com/TS-mfon/0g-guardian`

Frontend:
`https://0g-guardian.vercel.app`

0G proof links:
Fill after mainnet deployment:

- AgentFunCore contract:
- ChainScan:
- AgentLaunched tx:
- Storage root:
- DA commitment:
- Agent ID token:

## X Post Template

```text
Introducing Agent.fun on 0G for the #0GHackathon.

Launch AI agents, tokenize them as Agent ID iNFTs, let users pay to use them, and track memory, compute, DA proofs, and revenue on 0G.

Built with 0G Storage, 0G Compute, 0G Chain, 0G DA, and Agent ID.

#BuildOn0G
@0G_labs @0g_CN @0g_Eco @HackQuest_
```
