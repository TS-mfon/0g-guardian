# Backend API Documentation

Agent.fun is primarily wallet and SDK driven. The app uses small Next.js API routes for compute, storage, and DA workflows.

## POST `/api/storage/upload-json`

Uploads a JSON payload to 0G Storage using the server wallet configured in `SERVER_WALLET_PRIVATE_KEY`.

Request:

```json
{
  "version": "1.0",
  "app": "agent.fun"
}
```

Response:

```json
{
  "rootHash": "0x...",
  "txHash": "0x...",
  "sizeBytes": 1234,
  "mode": "0g-storage"
}
```

Used for:

- agent metadata
- initial memory
- task prompts
- task results
- updated memory snapshots

## POST `/api/compute/run-agent`

Runs an agent task through the 0G Compute-compatible inference path and returns a compute hash. This route is useful for previews and internal workflows, but production paid tasks should use `/api/tasks/execute` so payment, Storage, DA, and chain completion are verified in one executor flow.

Request:

```json
{
  "metadata": {
    "version": "1.0",
    "app": "agent.fun",
    "name": "AuditLite"
  },
  "prompt": {
    "version": "1.0",
    "agentId": "3",
    "requester": "0x...",
    "prompt": "Review this Solidity function.",
    "createdAt": "2026-05-09T00:00:00.000Z"
  },
  "model": "qwen/qwen-2.5-7b-instruct"
}
```

Response:

```json
{
  "response": "Task response...",
  "provider": "0G Compute workflow",
  "model": "qwen/qwen-2.5-7b-instruct",
  "computeHash": "0x..."
}
```

Production behavior:

- Requires `OG_COMPUTE_KEY`.
- Uses `https://router-api.0g.ai/v1` by default.
- Does not return fallback output unless `OG_DEMO_MODE=true`.
- Returns a clean configuration error when 0G Compute is not configured.

## POST `/api/tasks/execute`

Executes a paid task through the approved server executor.

Request:

```json
{
  "taskId": "1",
  "metadata": {
    "version": "1.0",
    "app": "agent.fun",
    "name": "AuditLite",
    "symbol": "AUDIT",
    "description": "Solidity review agent",
    "category": "developer",
    "creator": "0x...",
    "agentIdTokenId": "3",
    "avatar": { "prompt": "Audit AI agent" },
    "systemPrompt": "Review smart contracts carefully.",
    "model": { "provider": "0G Compute", "modelId": "deepseek-v4-flash", "teeRequired": false },
    "pricing": { "minTaskFee": "0.0005", "chatFee": "0.0005", "creatorFeeBps": 300 },
    "createdAt": "2026-06-04T00:00:00.000Z"
  },
  "prompt": {
    "version": "1.0",
    "agentId": "3",
    "requester": "0x...",
    "prompt": "Review this Solidity function.",
    "createdAt": "2026-06-04T00:00:00.000Z"
  },
  "model": "deepseek-v4-flash"
}
```

Response:

```json
{
  "taskId": "1",
  "resultRoot": "0x...",
  "memoryRoot": "0x...",
  "computeHash": "0x...",
  "daCommitment": "0x...",
  "completionTx": "0x..."
}
```

Execution checks:

- Reads `getTask(taskId)` from 0G Chain.
- Rejects unpaid, completed, mismatched, or invalid tasks.
- Runs 0G Compute.
- Uploads result and memory to 0G Storage.
- Submits the proof payload to 0G DA.
- Signs `completeTask` with `EXECUTOR_PRIVATE_KEY`.
- Requires the executor wallet to be authorized on-chain with `setExecutor`.

## POST `/api/da/submit`

Submits a DA commitment payload for task completion.

Request:

```json
{
  "app": "agent.fun",
  "eventType": "task",
  "agentId": "1",
  "taskId": "1",
  "resultRoot": "0x...",
  "computeHash": "0x..."
}
```

Response:

```json
{
  "commitment": "0x...",
  "mode": "gateway"
}
```

Production behavior:

- Requires `OG_DA_GATEWAY_URL`.
- Returns `503 DA_NOT_CONFIGURED` when DA is not configured.
- Deterministic fallback exists only when `OG_DEMO_MODE=true`.
- Production tasks should remain pending when DA fails.

## POST `/api/agent/generate-profile`

Generates a launch profile from an idea and category.

Used for future richer creator onboarding.
