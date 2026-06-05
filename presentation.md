# Agent.fun on 0G: Weekly Product and Engineering Update

## 1. Executive Summary

This week Agent.fun moved closer to a real 0G-native agent economy: creators can launch Agent ID-backed agents, users interact with live on-chain agents, task execution is tied to creator-funded 0G Compute, and task receipts carry storage roots, compute hashes, and completion transactions.

The biggest product shift is that Agent.fun is no longer just a marketplace screen. It is now a launch, activation, usage, key-market, and creator-management system for AI agents on 0G.

## 2. Product Direction

Agent.fun is designed as a pump.fun-style launchpad for useful AI agents:

- creators launch agents
- creators choose compatible 0G Compute models
- users buy agent keys
- users run paid tasks
- agents return useful outputs
- creators manage compute and claim creator earnings
- users inspect proof-linked receipts

The product avoids fake state: Arena and agent pages use live 0G Chain reads, and proof values only appear after confirmed actions.

## 3. 0G Integration Progress

### 0G Chain

`AgentFunCore` records launches, key trades, paid tasks, task completion, creator earnings, pause states, and executor permissions.

Mainnet:

- AgentFunCore: `0x4a38251e67229438235B0999cEb086Cb2987b55C`
- Agent ID: `0xD64faeE84313F7564E7dc7655088c3b4A4263CfB`

Galileo:

- AgentFunCore: `0x45119A32ca6C4d67424401dA92Abe4EC6c83f8Ce`
- Agent ID: `0xB0DBC829dF852Ea96C14A7D06cE8D773B1F8892b`

Protocol wallet:

- `0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E`

### Agent ID

Agent launches mint an Agent ID token before registration. The Agent ID token ID is stored in the agent record and displayed on the agent page.

### 0G Storage

The app stores:

- agent metadata
- initial memory
- task prompts
- task results
- updated memory snapshots

Storage roots are used in launch previews and task receipts.

### 0G Compute

Creators now choose the model their agent will use. Compute activation is creator-funded, and users are blocked from paying for a task until the creator activates compute.

### Optional 0G DA

0G DA is now treated as an optional advanced proof layer. If configured, task receipts attach DA commitments. If unavailable, the core task still completes with Storage roots, compute hash, and 0G Chain completion.

## 4. UI/UX Updates

Completed or planned in this sprint:

- creator/user UI separation
- creator-only compute activation
- creator-only earnings claim controls
- cleaner wallet rejection messages
- better card spacing and padding
- readable dropdowns
- no fake agents in Arena
- no random proof hashes after rejected transactions
- task result receipts with answer and proof trail
- model matrix for launch clarity

## 5. Compute Model Strategy

Model-task binding prevents creators from launching agents with the wrong model type.

- chat: `deepseek-v4-flash`
- research: `qwen3.6-plus`, `deepseek-v4-flash`
- developer: `0GM-1.0-35B-A3B`, `deepseek-v4-pro`
- trading: `glm-5`, `zai-org/GLM-5-FP8`
- social: `deepseek-v4-flash`
- game: `deepseek-v4-flash`
- vision: `qwen/qwen3-vl-30b-a3b-instruct`
- image: `z-image`
- audio: `openai/whisper-large-v3`

Trading models require TEE-ready execution.

## 6. Creator Workflow

1. Connect wallet.
2. Pick task type.
3. Pick compatible 0G Compute model.
4. Upload metadata and memory to 0G Storage.
5. Mint Agent ID.
6. Launch on 0G Chain.
7. Activate compute now or later.
8. Manage agents from Portfolio.
9. Claim creator earnings from creator-only UI.

## 7. User Workflow

1. Browse live agents.
2. Review key price, market cap, readiness, and task count.
3. Buy keys.
4. Submit paid task only when compute is active.
5. Receive result receipt.
6. Inspect completion transaction and proof roots.

## 8. Compare Lab

Arena now needs a real compare workflow:

- select two live agents
- run the same paid task against both
- execute both through the task pipeline
- display two receipts side by side
- let the user compare quality, model, roots, hashes, and completion transactions

## 9. Testing Status

Fresh local verification from this week:

- `npm run test:contracts`: 16 passed, 0 failed
- `npm run typecheck`: passed
- `npm run build`: passed
- `npm audit --audit-level=low`: reports 19 low-severity transitive `elliptic` issues through dependency tree, no upstream fix available

## 10. Contract Coverage

Current tests cover:

- launch
- launch fee accounting
- duplicate Agent ID rejection
- key buy/sell
- key price pump
- task creation
- authorized executor completion
- requester cannot fake completion
- creator cannot complete unless executor
- expired task refunds
- expired task cannot complete
- open task must be marked running before completion
- pause states
- closed-form key pricing
- creator-only memory updates
- paginated agent/task IDs

Next tests to add:

- creator claim after key purchase
- creator claim after completed task
- exact claim transfer
- claim zero behavior
- sell reserve safety
- complete refunded task rejection
- overpayment accounting

## 11. Known Risks

- 0G DA has no guaranteed public REST URL, so it should remain optional unless the 0G team provides a hosted endpoint or we operate our own adapter.
- Some 0G Compute SDK transitive dependencies still report low-severity audit issues with no available fix.
- Network-aware API execution must remain strict so mainnet/testnet task IDs cannot collide.
- Creator compute activation must never leak provider tokens or private keys.

## 12. Next Sprint Priorities

P0:

- make DA optional in task completion
- restore creator-only earnings claim UI
- expose full model matrix
- fix model-task validation
- improve card padding/dropdowns
- expand docs into subpages
- create and ship this presentation

P1:

- add compare execution flow
- add revenue claim tests
- add network-aware compute key storage
- add API tests for task execution failures
- improve mobile layouts

P2:

- provider health checks
- richer creator analytics
- public task history explorer
- optional DA gateway adapter
- agent leaderboard

## 13. Demo Script

1. Open landing page and explain Agent.fun as a 0G-native agent launchpad.
2. Open Launch and show task type/model binding.
3. Launch or inspect an existing live agent.
4. Open agent page and show key market.
5. Show creator-only compute activation.
6. Run or explain paid task flow.
7. Show task result receipt.
8. Open Portfolio and show creator management plus earnings claim controls.
9. Open Docs and show the 0G integration sections.

## 14. Team Ask

We need to finish the remaining implementation backlog, verify a live task execution path, polish UI spacing, and prepare final HackQuest submission assets with screenshots, demo clip, repository link, deployed app link, contract addresses, and X post.
