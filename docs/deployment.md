# Agent.fun Deployment

## Contracts

```bash
npm run test:contracts
DEPLOYER_PRIVATE_KEY=0x... npm run deploy:mainnet
```

The script deploys:

- `AgentFunCore`
- `MockAgentId` adapter

## Vercel Env

```text
NEXT_PUBLIC_AGENT_FUN_CORE_ADDRESS=0x...
NEXT_PUBLIC_AGENT_ID_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_0G_CHAIN_ID=16661
NEXT_PUBLIC_0G_CHAIN_ID_HEX=0x4115
NEXT_PUBLIC_0G_RPC_URL=https://evmrpc.0g.ai
NEXT_PUBLIC_0G_EXPLORER=https://chainscan.0g.ai
NEXT_PUBLIC_0G_STORAGE_INDEXER=https://indexer-storage-turbo.0g.ai
NEXT_PUBLIC_0G_STORAGE_SCAN=https://storagescan.0g.ai
NEXT_PUBLIC_0G_COMPUTE_BASE_URL=https://router-api.0g.ai/v1
NEXT_PUBLIC_0G_COMPUTE_MODEL=deepseek-v4-flash
NEXT_PUBLIC_0G_DIRECT_PROVIDER=0xd9966e13a6026Fcca4b13E7ff95c94DE268C471C
AGENTFUN_DATA_DIR=.agentfun-data
AGENTFUN_CREDENTIAL_SECRET=
OG_COMPUTE_KEY=
OG_DA_GATEWAY_URL=
```

Agent creators activate compute from the agent page. The app guides them through the required 0G Compute wallet transactions: 3 0G ledger creation when needed, 1 0G provider funding when needed, provider acknowledgement, and encrypted direct provider token storage.

`OG_DA_GATEWAY_URL` is optional in v1. When it is configured, task receipts can attach a DA commitment. When it is empty, tasks still complete with 0G Storage roots, compute hash, and 0G Chain completion.

Do not expose deployer keys, GitHub tokens, Vercel tokens, or private compute keys through `NEXT_PUBLIC_*`.
