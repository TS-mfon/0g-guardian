# Agent.fun Weekly Product and Engineering Update

> Historical artifact. Galileo testnet support described below has since been removed; the dApp now targets 0G Mainnet only.

## Executive Summary

This week Agent.fun moved from a prototype marketplace into a real, multi-network agent economy on 0G. We audited the complete launch, wallet, compute, task, revenue, and network flows; fixed the highest-impact failures; deployed a corrected V2 contract on Galileo and mainnet; and rebuilt the frontend around truthful network-specific state.

The product is now designed around a simple promise:

> Creators launch and activate useful agents. Users pay for real tasks. 0G proves identity, memory, execution, payments, and settlement.

## What We Changed

### Contract and Economic Layer

- Built and deployed `AgentFunCoreV2`.
- Added Agent ID ownership verification during launch.
- Bound each agent to a readable model ID and approved model hash.
- Added creator activation before users can fund tasks.
- Changed compute billing from creator-managed provider accounts to user-funded task budgets.
- Added automatic unused-compute refunds.
- Separated protocol treasury, compute treasury, and per-agent creator revenue.
- Added creator-only per-agent revenue claims.
- Removed mandatory DA commitments that previously blocked task completion.
- Preserved legacy contracts as historical read-only deployments.

### Network Reliability

- Removed global mainnet assumptions from chain reads and task execution.
- Added cookie-persisted selected network for server-rendered pages.
- Added selected-network contract, RPC, Storage, and Compute handling.
- Added live readiness checks for RPC, V2 contract bytecode, Agent ID, and Storage.
- Deployed and verified V2 on 0G Mainnet and Galileo.

### Wallet UX

- Added one root wallet provider so wallet state survives route navigation.
- Stopped the connected nav button from repeatedly requesting account access.
- Separated refresh, network switch, connect, and disconnect behavior.
- Prevented transient empty account events from clearing remembered wallet intent.
- Improved rejection, wrong-network, insufficient-funds, and RPC error messages.

### Real Compute and Agent Behavior

- Added live Router model and pricing discovery on mainnet.
- Added live direct-provider discovery on Galileo.
- Verified Galileo currently exposes Qwen Omni and Qwen Image Edit providers.
- Disabled models that are unavailable on the selected network.
- Added live task compute quotes before users pay.
- Changed execution to load the creator’s actual metadata and system prompt from 0G Storage.
- Removed creator API-key onboarding and ephemeral creator-key storage.
- Added direct-provider response settlement through `processResponse` on Galileo.
- Corrected task receipts so `memoryRootBefore` and persisted memory history reference the agent's real on-chain memory root.
- Kept paid task transaction links visible when downstream execution is pending or fails, preserving a path to retry or refund.

### Creator Privacy and UI

- Creator revenue controls no longer render for normal users.
- Portfolio only renders Creator Console for wallets that launched agents.
- Revenue is displayed and claimed per agent.
- Activation and revenue claims use independent state machines.
- Fixed the overflowing Task Volume/key-market card.
- Added responsive auto-fit metrics and safer card boundaries.
- Scoped Creator Console pending tasks to the connected creator's own agents.
- Limited Compare to agents that are both active and compute-activated, before any wallet payment is requested.

## Current Architecture

```text
Creator wallet
  -> upload profile and memory to 0G Storage
  -> mint Agent ID
  -> launch approved model on AgentFunCoreV2
  -> activate compute

User wallet
  -> request live model quote
  -> escrow service fee and compute budget
  -> verified executor loads real metadata from 0G Storage
  -> 0G Compute runs the selected agent
  -> result and memory upload to 0G Storage
  -> V2 settles compute, creator revenue, protocol revenue, and refund
```

## Live V2 Deployments

### Mainnet

- AgentFunCoreV2: `0x637e7F5BF1dF450E0e4Cf7D80156C70210f3dB46`
- Agent ID: `0xA2BD5625E382eB759379681C69f319501b7BA7F1`
- Core deploy transaction: `0xe962358bae9639b9ccae8e1cf381a1d11c9d2b2356a9db4dae841576951831da`

### Galileo

- AgentFunCoreV2: `0x28696a881D57BC3Ed88AbE082a82934d8b82E893`
- Agent ID: `0x2d46d1ED4eC91593889f106b0a3aF1BF38a4458d`
- Core deploy transaction: `0x5e692f092f4a8e22a2b4d928c5453f603070f5d27bf82d500204fb7a696a2e0f`

Protocol revenue is assigned to `0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E`.

## Testing and Verification

- 27 Foundry tests passing.
- V2 tests cover Agent ID ownership, approved models, activation, per-agent claims, user-funded compute, maximum compute spend, refunds, and expiration.
- TypeScript typecheck passing.
- Production Next.js build passing.
- Mainnet and Galileo contract bytecode verified through live RPC.
- Mainnet treasury address verified through live contract read.
- Galileo Compute providers and prices verified through the official 0G Compute SDK.
- Live task quotes verified for Galileo Qwen Omni and mainnet GLM-5.
- Production readiness endpoints correctly block paid tasks while real funded Compute credentials are absent.

## How to Demo

1. Open Agent.fun and switch between Mainnet and Galileo.
2. Show live model availability changing by network.
3. Open Launch and explain that unavailable models are disabled.
4. Launch an agent and show real Storage roots only after confirmation.
5. Open the agent as a normal wallet and show no creator revenue.
6. Connect the creator wallet and show private activation and per-agent claim controls.
7. Activate compute.
8. Submit a paid task and explain live pricing, escrow, compute settlement, and refund.
9. Show task output, Storage roots, compute hash, and completion transaction.
10. Open Arena and compare two active agents with the same paid workflow.

## Remaining Production Work

- Fund and configure the platform mainnet Router account.
- Fund and configure the Galileo direct-provider account.
- Move task orchestration from Vercel functions to the VPS for durable queues and retries.
- Add end-to-end browser tests and continuous health monitoring.
- Add specialized image, vision, and audio task input surfaces.
- Complete external smart-contract review before meaningful value is deposited.

## Team Pitch

Agent.fun is not another AI chat interface. It is an economic launch layer for owned, paid, and verifiable AI services. 0G is essential to the product because it provides the identity, storage, compute marketplace, and settlement chain needed to turn an agent into a durable on-chain business.
