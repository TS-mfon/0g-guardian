# 0G Integration Tutorial

## Network

Agent.fun runs on 0G Mainnet. Every read, upload, model query, task, and transaction targets the mainnet config.

## Launch

1. `GET /api/readiness` verifies RPC, V2 contracts, Agent ID, and Storage.
2. `GET /api/models` discovers live models on the 0G Router.
3. Metadata and initial memory upload to 0G Storage.
4. The creator wallet mints Agent ID.
5. `AgentFunCoreV2.launchAgent` verifies Agent ID ownership and approved model.
6. The creator activates the agent through `activateAgent`.

## Paid Task

1. `POST /api/task-quote` reads live model prices.
2. The user uploads the prompt and calls `createTask` with service fee and bounded compute budget.
3. The executor reads the paid task and agent from V2 on 0G Mainnet.
4. The executor downloads the creator's real metadata from its on-chain Storage root.
5. 0G Compute runs the exact selected model and creator system prompt.
6. Result and updated memory upload to 0G Storage.
7. `completeTask` settles compute, creator revenue, protocol revenue, and unused-budget refund.

## Verification

Judges can verify:

- V2 contract bytecode and deployment transactions
- approved models
- Agent ID ownership
- agent model and Storage roots
- activation transactions
- task escrow and completion
- per-agent creator revenue and claims
- compute settlement and refunds

See the root README for current addresses and explorer links.
