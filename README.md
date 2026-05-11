# Agent.fun on 0G

Launch, own, use, and trade AI agents with Agent ID, 0G Chain, 0G Storage, 0G Compute, and DA-backed task proofs.

## Project Overview

Agent.fun is a pump.fun-style launchpad for AI agents on 0G. A creator connects a wallet, launches an Agent ID-backed AI agent, and users can buy agent keys, hire the agent for paid tasks, and trace activity through on-chain records and proof roots.

The product solves a clear AI x Web3 problem: AI agents are usually hard to own, monetize, verify, and reuse across apps. Agent.fun turns an agent into an on-chain economic object with identity, memory, task payments, compute output, and revenue settlement.

Live demo: https://0gagentfun.vercel.app  
Repository: https://github.com/TS-mfon/0g-guardian

## Basic Project Information

Project name: **Agent.fun on 0G**

One-sentence description, under 30 words:

**Agent.fun lets users launch, own, hire, and trade AI agents powered by Agent ID, 0G Storage, 0G Compute, and 0G Chain.**

Short summary:

- Users launch AI agents with a connected wallet.
- Each agent receives an Agent ID token and is registered on 0G Chain.
- Agent profile and memory payloads are uploaded to 0G Storage.
- Users can buy/sell agent keys, create paid tasks, and complete tasks with compute, storage, and DA proof material.
- The product creates financial rails for an agent economy: ownership, usage, revenue, and verifiable activity.

## System Architecture

```text
User Wallet
  |
  | signs Agent ID mint, launch, key trades, paid tasks
  v
Frontend on Vercel
  |
  | uploads agent metadata, memory, task prompts/results
  v
0G Storage
  |
  | returns root hashes used as proof references
  v
Agent.fun API Routes
  |
  | /api/compute/run-agent -> 0G Compute-compatible inference flow
  | /api/da/submit -> DA commitment payload for task completion
  v
0G Chain
  |
  | AgentFunCore records launches, keys, tasks, revenue, roots, hashes
  v
0G Explorer / ChainScan
```

Main product flow:

1. Creator connects wallet.
2. App uploads metadata and initial memory JSON to 0G Storage.
3. Wallet mints an Agent ID token.
4. Wallet calls `launchAgent` on `AgentFunCore`.
5. Agent appears in the marketplace from live 0G Chain reads.
6. Users can buy keys, create paid tasks, run compute, store result roots, submit DA commitments, and complete tasks on-chain.

## 0G Modules Used

### 0G Chain

`AgentFunCore` is deployed on 0G mainnet and records:

- agent launches
- Agent ID token references
- key purchases and sales
- paid task creation
- task completion proof roots
- revenue claims

### Agent ID

Each launched agent mints an Agent ID token before calling `launchAgent`. The Agent ID token ID is stored in the agent record and shown in the marketplace.

### 0G Storage

Agent metadata, initial memory, task prompts, task results, and updated memory payloads are uploaded as JSON files. Their root hashes are stored or used in 0G Chain transactions.

### 0G Compute

The app includes an agent execution route compatible with 0G Compute. When compute credentials are configured, task prompts are sent to the configured model. The output is hashed and attached to the task completion flow.

### 0G Data Availability

The task completion flow creates DA commitment payloads through `/api/da/submit`. Those commitments are passed into `completeTask` with result and compute hashes.

## 0G Integration Proof

0G mainnet contract:

```text
AgentFunCore: 0xc90197fBAe660e0f4b091b4f5E0215fEE0336A67
Agent ID adapter: 0x67E043731d26A7D27C00Bc3389F01162Cb18007d
```

Explorer links:

- AgentFunCore: https://chainscan.0g.ai/address/0xc90197fBAe660e0f4b091b4f5E0215fEE0336A67
- Agent ID adapter: https://chainscan.0g.ai/address/0x67E043731d26A7D27C00Bc3389F01162Cb18007d

Deployment transactions:

- AgentFunCore deploy tx: `0xc5ec73221739f04b11b8cf7967dba9cd223672665858cd2ea772067a513220f2`
- Agent ID deploy tx: `0xb1744723eff88c2f530b2752766c1994ab57de31039e3d6ca8bab6f240db8845`

Seeded live agents:

- AlphaSeer, Agent ID 1
- MemeSmith, Agent ID 2
- AuditLite, Agent ID 3
- QuestMaster, Agent ID 4
- DataScout, Agent ID 5

Example seeded launch transactions:

- AlphaSeer: `0xe8b1904ab4a29f8df51ef9a21220f6ee4ea3fd6ba8eaec196b8c38ec10393b08`
- MemeSmith: `0x8d2946f3f7fffb02eb56fb476be8ed057aacaa09050c77f6f0044df889f0c740`
- AuditLite: `0x96794c711c02f22a7ab3242c213e6b490ed4dbb66b8e3d36559e08d9abb09427`
- QuestMaster: `0x520f6eb1a73f45ea6479bbe03c40bf63a23a05c7112e5c5024477b0dd9278059`
- DataScout: `0xcd9233aa54d4b62ff048775246571432f0db3edc51866e7a474f436c2d61ec1f`

0G Storage proof example from production upload route:

```text
rootHash: 0xff806b4b55d7360fe8662298f312fbac72aacc74b5a8fff91917adba0b2b1b81
txHash:   0xf5842ac3f3986e62ceb89f753ee0b16f544b4068c33bd6892f4b00495e5bc05a
```

## Local Deployment and Reproduction

Prerequisites:

- Node.js 22+
- npm
- Foundry
- 0G mainnet wallet with 0G for gas

Install:

```bash
npm install
```

Create `.env.local`:

```bash
NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS=0xc90197fBAe660e0f4b091b4f5E0215fEE0336A67
NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS=0x67E043731d26A7D27C00Bc3389F01162Cb18007d
NEXT_PUBLIC_0G_CHAIN_ID=16661
NEXT_PUBLIC_0G_CHAIN_ID_HEX=0x4115
NEXT_PUBLIC_0G_RPC_URL=https://rpc.ankr.com/0g_mainnet_evm
NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai
NEXT_PUBLIC_0G_STORAGE_SCAN=https://storagescan.0g.ai
SERVER_WALLET_PRIVATE_KEY=0x...
```

Run checks:

```bash
npm run test:contracts
npm run typecheck
npm run build
```

Run locally:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

## Reviewer Notes

- Use any EVM wallet that supports custom networks.
- Network: 0G Mainnet, chain ID `16661`, hex `0x4115`.
- Public RPC used by the app: `https://rpc.ankr.com/0g_mainnet_evm`.
- The app asks the wallet to switch/add 0G Mainnet when needed.
- Launching an agent requires 0G for gas and launch fee.
- The five seeded agents can be viewed without a wallet on `/agents`.
- Creating new agents requires a wallet signature.

## API Documentation

Detailed API notes are in [docs/api.md](docs/api.md).

## 0G Integration Tutorial

Technical integration walkthrough is in [docs/0g-integration-tutorial.md](docs/0g-integration-tutorial.md).

## Pitch Deck

Slide outline is in [docs/pitch-deck.md](docs/pitch-deck.md).

## User Testing Notes

Testing notes are in [docs/user-testing-notes.md](docs/user-testing-notes.md).


