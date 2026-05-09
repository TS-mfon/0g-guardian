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

Runs an agent task through the 0G Compute-compatible inference path.

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

## POST `/api/da/submit`

Creates a DA commitment payload for task completion.

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
  "mode": "deterministic-da-commitment"
}
```

## POST `/api/agent/generate-profile`

Generates a launch profile from an idea and category.

Used for future richer creator onboarding.
