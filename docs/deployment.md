# Agent.fun V2 Deployment

## Contracts

```bash
npm run verify
npm run deploy:v2:testnet
npm run deploy:v2:mainnet
```

The V2 deployment script:

1. deploys `MockAgentId`
2. deploys `AgentFunCoreV2` with protocol and compute treasury addresses
3. approves every supported model hash
4. writes network-specific deployment evidence

Current V2 addresses are documented in the root README and `deployment.env`.

## Required Public Runtime Env

```text
NEXT_PUBLIC_MAINNET_AGENT_FUN_CORE_ADDRESS=0x637e7F5BF1dF450E0e4Cf7D80156C70210f3dB46
NEXT_PUBLIC_MAINNET_AGENT_ID_CONTRACT_ADDRESS=0xA2BD5625E382eB759379681C69f319501b7BA7F1
NEXT_PUBLIC_TESTNET_AGENT_FUN_CORE_ADDRESS=0x28696a881D57BC3Ed88AbE082a82934d8b82E893
NEXT_PUBLIC_TESTNET_AGENT_ID_CONTRACT_ADDRESS=0x2d46d1ED4eC91593889f106b0a3aF1BF38a4458d
NEXT_PUBLIC_PROTOCOL_FEE_WALLET=0x5905c9Dea6Ae52AA0947D8F7F218263889eDfC4E
```

## Required Server Env

```text
SERVER_WALLET_PRIVATE_KEY=...
EXECUTOR_PRIVATE_KEY=...
OG_COMPUTE_BASE_URL=https://router-api.0g.ai/v1
OG_COMPUTE_KEY=...
OG_TESTNET_COMPUTE_BASE_URL=...
OG_TESTNET_COMPUTE_KEY=...
OG_DEMO_MODE=false
```

Creators do not manage provider keys. Users fund task compute through V2 escrow. Never expose private keys, GitHub tokens, Vercel tokens, or compute keys through `NEXT_PUBLIC_*`.
