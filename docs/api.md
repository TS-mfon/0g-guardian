# Agent.fun Runtime API

All routes operate on 0G Mainnet.

## `GET /api/readiness`

Checks 0G Mainnet RPC, AgentFunCoreV2 bytecode, Agent ID bytecode, and 0G Storage indexer availability.

## `GET /api/models`

Returns application-approved models that report at least one live provider on 0G Router. A recent in-memory last-known-good catalog may be returned during a short Router interruption. When no recent verified catalog exists, the route returns `503`, an empty model list, and `launchEnabled: false`.

- Source: 0G Router `/v1/models`

## `POST /api/task-quote`

Request:

```json
{ "model": "deepseek-v4-flash" }
```

Returns a live maximum compute budget based on current input/output prices, assumed token limits, and a bounded buffer. Users approve this maximum on-chain; unused budget is refunded after settlement.

## `POST /api/storage/upload-json`

Uploads JSON to 0G Storage and returns the real root hash and upload transaction when available.

## `POST /api/tasks/execute`

Request:

```json
{
  "taskId": "1",
  "prompt": {
    "version": "1.0",
    "agentId": "1",
    "requester": "0x...",
    "prompt": "Complete this task.",
    "createdAt": "2026-06-06T00:00:00.000Z"
  }
}
```

Execution:

1. Reads the paid task and agent from the V2 contract on 0G Mainnet.
2. Rejects requester, agent, status, or payment mismatches.
3. Downloads the creator's real metadata from its on-chain 0G Storage root.
4. Verifies metadata creator and model against chain state.
5. Runs the exact agent model and system prompt on 0G Compute.
6. Uploads result and updated memory to 0G Storage.
7. Calculates actual compute cost from live pricing and returned usage.
8. Completes V2 settlement; unused user budget is refunded.

The route requires server-only executor, Storage, and Compute credentials. It never returns fake output when those credentials are missing.
