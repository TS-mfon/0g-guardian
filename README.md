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

0G mainnet contracts:

```text
AgentFunCore: 0x4a38251e67229438235B0999cEb086Cb2987b55C
Agent ID:     0xD64faeE84313F7564E7dc7655088c3b4A4263CfB
Protocol fee wallet: 0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E
```

0G Galileo testnet contracts:

```text
AgentFunCore: 0x45119A32ca6C4d67424401dA92Abe4EC6c83f8Ce
Agent ID:     0xB0DBC829dF852Ea96C14A7D06cE8D773B1F8892b
```

Explorer links:

- AgentFunCore: https://chainscan.0g.ai/address/0x4a38251e67229438235B0999cEb086Cb2987b55C
- Agent ID: https://chainscan.0g.ai/address/0xD64faeE84313F7564E7dc7655088c3b4A4263CfB
- Galileo AgentFunCore: https://chainscan-galileo.0g.ai/address/0x45119A32ca6C4d67424401dA92Abe4EC6c83f8Ce
- Galileo Agent ID: https://chainscan-galileo.0g.ai/address/0xB0DBC829dF852Ea96C14A7D06cE8D773B1F8892b

Deployment transactions:

- Mainnet AgentFunCore deploy tx: `0xdb45e8aad60494653b4a7ef094e831d094e1bf50f0520bd3629335ddcc571381`
- Mainnet Agent ID deploy tx: `0x02fb095e1f766f5b17906b098fd5aa966110495a6480d84840cf3c4f19a0e05a`
- Galileo AgentFunCore deploy tx: `0x3d59d64358c58cf76368181ca89239a87849c36fa35bf161236a7f86c0c8ccdf`
- Galileo Agent ID deploy tx: `0x5a4a7260f93f04ddd0e5055acc742b4e9479aefbe7068ba2ea86a80480258a26`
- Mainnet ownership transfer to protocol fee wallet: `0x24fc9165609bef5f6acdc29e110b825b04f933fa9b1275ea253d273dff8d82f0`
- Galileo ownership transfer to protocol fee wallet: `0xabdb7bcdadfe0600e09042ee07fd606284a10375446b1a890392ea4f96830c48`

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
NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS=0x4a38251e67229438235B0999cEb086Cb2987b55C
NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS=0xD64faeE84313F7564E7dc7655088c3b4A4263CfB
NEXT_PUBLIC_MAINNET_AGENT_FUN_CORE_ADDRESS=0x4a38251e67229438235B0999cEb086Cb2987b55C
NEXT_PUBLIC_MAINNET_AGENT_ID_CONTRACT_ADDRESS=0xD64faeE84313F7564E7dc7655088c3b4A4263CfB
NEXT_PUBLIC_TESTNET_AGENT_FUN_CORE_ADDRESS=0x45119A32ca6C4d67424401dA92Abe4EC6c83f8Ce
NEXT_PUBLIC_TESTNET_AGENT_ID_CONTRACT_ADDRESS=0xB0DBC829dF852Ea96C14A7D06cE8D773B1F8892b
NEXT_PUBLIC_PROTOCOL_FEE_WALLET=0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E
NEXT_PUBLIC_0G_CHAIN_ID=16661
NEXT_PUBLIC_0G_CHAIN_ID_HEX=0x4115
NEXT_PUBLIC_0G_RPC_URL=https://rpc.ankr.com/0g_mainnet_evm
NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai
NEXT_PUBLIC_0G_STORAGE_SCAN=https://storagescan.0g.ai
NEXT_PUBLIC_0G_COMPUTE_BASE_URL=https://router-api.0g.ai/v1
NEXT_PUBLIC_0G_COMPUTE_MODEL=zai-org/GLM-5-FP8
NEXT_PUBLIC_0G_DIRECT_PROVIDER=0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C
SERVER_WALLET_PRIVATE_KEY=0x...
EXECUTOR_PRIVATE_KEY=0x...
AGENTFUN_DATA_DIR=.agentfun-data
AGENTFUN_CREDENTIAL_SECRET=...
OG_COMPUTE_KEY=...
OG_DA_GATEWAY_URL=https://your-vps.example/internal/da/submit
OG_DEMO_MODE=false
```

`SERVER_WALLET_PRIVATE_KEY` is used only for sponsored 0G Storage uploads. `EXECUTOR_PRIVATE_KEY` is the wallet authorized with `setExecutor` to complete paid tasks after verifying payment, 0G Compute output, 0G Storage roots, and 0G DA commitment. Do not put either key in `NEXT_PUBLIC_*`.

Creators do not need to paste a 0G Compute key. Each agent page includes creator-funded compute activation: the creator signs 0G Compute ledger/provider funding transactions, the app generates a direct provider token from the creator wallet signature, and the token is encrypted server-side for paid task execution.

Run checks:

```bash
npm run verify
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
- The wallet panel includes a 0G Mainnet/Galileo selector. Testnet requires testnet contract addresses before write actions work.
- Launching an agent requires 0G for gas and launch fee.
- Paid tasks are created by the user wallet, then completed by an approved executor wallet through `/api/tasks/execute`.
- Production task execution requires `OG_COMPUTE_KEY`, `SERVER_WALLET_PRIVATE_KEY` or `EXECUTOR_PRIVATE_KEY`, and `OG_DA_GATEWAY_URL`. Without those, tasks remain pending instead of showing fake completed proofs.
- The five seeded agents can be viewed without a wallet on `/agents`.
- Creating new agents requires a wallet signature.
- `/portfolio` includes a creator console that filters launched agents by the connected creator wallet.
- Agent key prices are bonding-curve based: buying more keys increases supply, the next key price, and displayed market cap.
- Users earn from keys through sellable appreciation, not passive dividends in this v1 contract.
- Task payment is blocked before escrow if the creator has not activated 0G Compute for that agent.

## API Documentation

Detailed API notes are in [docs/api.md](docs/api.md).

## 0G Integration Tutorial

Technical integration walkthrough is in [docs/0g-integration-tutorial.md](docs/0g-integration-tutorial.md).

## Pitch Deck

Slide outline is in [docs/pitch-deck.md](docs/pitch-deck.md).

## User Testing Notes

Testing notes are in [docs/user-testing-notes.md](docs/user-testing-notes.md).
