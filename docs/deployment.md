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
NEXT_PUBLIC_0G_COMPUTE_MODEL=zai-org/GLM-5-FP8
OG_COMPUTE_KEY=
OG_DA_GATEWAY_URL=
```

Do not expose deployer keys, GitHub tokens, Vercel tokens, or private compute keys through `NEXT_PUBLIC_*`.
