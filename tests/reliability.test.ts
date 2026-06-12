import assert from "node:assert/strict";
import test from "node:test";
import { ethers } from "ethers";
import { agentFunCoreAbi } from "../packages/shared/src";
import { enforceRateLimit, requireInternalApiKey } from "../lib/api-security";
import { failedReadinessMessage, getCreatedTaskId } from "../lib/task-client";

test("platform-funded endpoints reject unauthenticated requests", () => {
  process.env.INTERNAL_API_KEY = "test-secret";
  assert.throws(() => requireInternalApiKey(new Request("https://agent.fun/api/storage/upload-json")), /authorization/i);
  assert.doesNotThrow(() => requireInternalApiKey(new Request("https://agent.fun/api/storage/upload-json", {
    headers: { "x-agent-fun-api-key": "test-secret" }
  })));
});

test("rate limiter rejects replay bursts", () => {
  const request = new Request("https://agent.fun/api/tasks/execute", { headers: { "x-forwarded-for": "203.0.113.10" } });
  enforceRateLimit(request, "test-replay", 1, 60_000);
  assert.throws(() => enforceRateLimit(request, "test-replay", 1, 60_000), /Too many requests/);
});

test("readiness failure exposes the exact blocker", () => {
  assert.equal(failedReadinessMessage({ checks: {
    rpc: { ok: true, message: "RPC ready" },
    executorGas: { ok: false, message: "Executor gas is low" }
  } }), "Executor gas is low");
});

test("task id is derived from the confirmed TaskCreated event", () => {
  const iface = new ethers.Interface(agentFunCoreAbi);
  const event = iface.encodeEventLog(iface.getEvent("TaskCreated")!, [42n, 7n, "0x0000000000000000000000000000000000000001", 1n, 1n]);
  const receipt = { logs: [{ topics: event.topics, data: event.data }] };
  assert.equal(getCreatedTaskId(receipt as never), "42");
});
