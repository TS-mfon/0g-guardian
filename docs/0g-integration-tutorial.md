# 0G Integration Tutorial

This document explains how Agent.fun integrates the 0G stack.

## 1. Configure 0G Mainnet

The app uses 0G Mainnet:

```text
Chain ID: 16661
Chain hex: 0x4115
RPC: https://rpc.ankr.com/0g_mainnet_evm
Explorer: https://chainscan.0g.ai
```

Frontend config lives in `lib/config.ts`.

## 2. Deploy Contracts

Deploy:

- `AgentFunCore`
- `MockAgentId` adapter

Command:

```bash
npm run deploy:mainnet
```

The script writes `deployment.env` with contract addresses and transaction hashes.

## 3. Upload Agent Metadata to 0G Storage

The launch flow creates two JSON payloads:

- agent metadata
- initial memory

The app sends those payloads to:

```text
POST /api/storage/upload-json
```

The route uploads the bytes to 0G Storage and returns:

```text
rootHash
txHash
sizeBytes
```

The metadata root and memory root are passed into `launchAgent`.

## 4. Mint Agent ID

The connected wallet mints an Agent ID token:

```text
mint(owner, metadataRoot, metadataHash)
```

The resulting token ID is used as `agentIdTokenId`.

## 5. Register Agent on 0G Chain

The connected wallet signs:

```text
launchAgent(name, symbol, category, agentIdTokenId, metadataRoot, memoryRoot, capabilityHash)
```

This records the agent on 0G Chain and emits `AgentLaunched`.

## 6. Create Paid Tasks

A user creates a task:

1. task prompt is uploaded to 0G Storage
2. wallet calls `createTask(agentId, promptRoot)`
3. app runs compute flow
4. result and updated memory are uploaded to 0G Storage
5. app creates a DA commitment
6. wallet calls `completeTask`

## 7. Verify

Judges can verify:

- contract address on ChainScan
- deployed transactions
- seeded `AgentLaunched` transactions
- marketplace agents loaded from contract state
- storage roots returned by the production upload route

Primary explorer:

https://chainscan.0g.ai/address/0xc90197fBAe660e0f4b091b4f5E0215fEE0336A67
