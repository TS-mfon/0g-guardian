# Agent.fun on 0G

Agent.fun is a launchpad and paid-task economy for useful AI agents. Creators launch Agent ID-backed agents, users buy keys and fund tasks, and every completed task produces verifiable 0G Chain, Storage, and Compute evidence.

- Live app: https://0gagentfun.vercel.app
- Repository: https://github.com/TS-mfon/0g-guardian
- Protocol treasury: `0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E`

## What Agent.fun Solves

AI agents normally have no portable identity, transparent ownership, durable memory, or native business model. Agent.fun combines these into one product:

- Agent ID establishes ownership.
- 0G Storage persists the exact creator profile, system prompt, memory, task prompts, and results.
- 0G Compute runs real inference using live provider/model pricing.
- 0G Chain records launches, activation, keys, task escrow, settlement, refunds, and creator revenue.

The app does not generate fake agents or fake proof values. Public agents come from chain reads, model availability comes from live 0G services, and proof values appear only after confirmed actions.

## Current V2 Contracts

### 0G Mainnet

- AgentFunCoreV2: `0x637e7F5BF1dF450E0e4Cf7D80156C70210f3dB46`
- Agent ID: `0xA2BD5625E382eB759379681C69f319501b7BA7F1`
- Core deployment: `0xe962358bae9639b9ccae8e1cf381a1d11c9d2b2356a9db4dae841576951831da`
- Agent ID deployment: `0x842770159aee8ed9e680df0121f8e87e4bb526ab3fba128cca5982ce3720c4b3`
- Explorer: https://chainscan.0g.ai/address/0x637e7F5BF1dF450E0e4Cf7D80156C70210f3dB46

## Product Flows

### Creator

1. Connect a wallet to 0G Mainnet.
2. Choose a task category and a model currently available on 0G Router.
3. Upload metadata and initial memory to 0G Storage.
4. Mint Agent ID and launch the agent on 0G Chain.
5. Activate compute with one contract transaction.
6. Manage the agent and privately claim per-agent revenue.

Creators never paste provider API keys or manually manage provider accounts.

### User

1. Browse agents read from 0G Mainnet.
2. Buy or sell an agent key through the bonding curve.
3. Submit a task after the app receives a live 0G Compute price quote.
4. Pay the service fee and maximum compute budget into task escrow.
5. Receive the result and a receipt containing Storage roots, compute hash, settled compute cost, and completion transaction.
6. Receive an automatic refund for unused compute budget.

## Architecture

```text
Creator/User Wallet
       |
       | Agent ID mint, launch, activation, keys, task escrow, claims
       v
AgentFunCoreV2 on 0G Mainnet
       |
       +--> per-agent creator revenue
       +--> protocol treasury revenue
       +--> compute treasury settlement
       +--> unused compute refunds

Next.js application
       |
       +--> live network readiness and model discovery
       +--> mainnet contract reads
       +--> task execution validation
       |
       +--> 0G Storage: metadata, memory, prompts, results
       +--> 0G Compute: 0G Router model catalog
```

0G DA was removed from the runtime because Agent.fun does not operate a rollup and does not need DA to complete tasks safely.

## Contract V2 Guarantees

- Launch requires ownership of the supplied Agent ID.
- Launch requires an approved model.
- Each agent stores a readable model ID and model hash.
- Tasks require creator compute activation.
- Users fund compute through a maximum budget.
- Compute settlement cannot exceed the user-approved budget.
- Unused compute budget is refunded automatically.
- Creator revenue is tracked and claimed per agent.
- Normal users cannot call creator-only management or claim functions.
- Protocol and compute treasury balances are separated.
- Emergency pause and two-step ownership transfer are supported.

## Live Model Strategy

Model availability and token prices are read dynamically from `https://router-api.0g.ai/v1/models`. A static fallback keeps the launch flow available if the router is briefly unreachable.

## Runtime APIs

- `GET /api/readiness`: RPC, V2 contracts, Agent ID, and Storage readiness on 0G Mainnet.
- `GET /api/models`: live mainnet models from the 0G Router with static fallback.
- `POST /api/task-quote`: live user compute budget quote.
- `POST /api/storage/upload-json`: uploads JSON to 0G Storage.
- `POST /api/tasks/execute`: validates paid task, loads real agent metadata, runs compute, stores result/memory, and completes settlement.

See [docs/api.md](docs/api.md) and [docs/0g-integration-tutorial.md](docs/0g-integration-tutorial.md).

## Local Setup

Requirements:

- Node.js 22+
- npm
- Foundry
- A wallet funded on the selected 0G network

```bash
npm install
cp .env.example .env.local
npm run verify
npm run dev
```

Required public configuration:

```bash
NEXT_PUBLIC_MAINNET_AGENT_FUN_CORE_ADDRESS=0x637e7F5BF1dF450E0e4Cf7D80156C70210f3dB46
NEXT_PUBLIC_MAINNET_AGENT_ID_CONTRACT_ADDRESS=0xA2BD5625E382eB759379681C69f319501b7BA7F1
NEXT_PUBLIC_TESTNET_AGENT_FUN_CORE_ADDRESS=0x28696a881D57BC3Ed88AbE082a82934d8b82E893
NEXT_PUBLIC_TESTNET_AGENT_ID_CONTRACT_ADDRESS=0x2d46d1ED4eC91593889f106b0a3aF1BF38a4458d
NEXT_PUBLIC_PROTOCOL_FEE_WALLET=0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E
```

Server-only configuration:

```bash
SERVER_WALLET_PRIVATE_KEY=...
EXECUTOR_PRIVATE_KEY=...
OG_COMPUTE_BASE_URL=https://router-api.0g.ai/v1
OG_COMPUTE_KEY=...
OG_TESTNET_COMPUTE_BASE_URL=...
OG_TESTNET_COMPUTE_KEY=...
OG_DEMO_MODE=false
```

Never expose server or compute keys through `NEXT_PUBLIC_*`.

## Testing

```bash
npm run test:contracts
npm run typecheck
npm run build
npm run verify
npm audit --audit-level=low
```

Current verified status:

- 27 Foundry tests pass: 19 legacy regression tests and 8 V2 security/economic tests.
- TypeScript typecheck passes.
- Production Next.js build passes.
- Mainnet V2 bytecode and counters were verified through live RPC reads.
- `npm audit` reports 19 low-severity transitive `elliptic` findings from the 0G Compute SDK dependency tree, with no available upstream fix.

## Reviewer Notes

- All actions target 0G Mainnet automatically.
- Creator revenue controls are rendered only when the connected wallet owns the agent.
- Blockchain data is inherently public, but Agent.fun does not expose creator revenue in normal-user UI.
- Production paid inference requires funded platform compute credentials. The application never substitutes fake output when credentials are unavailable.
