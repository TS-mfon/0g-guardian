import { ApiError } from "./api";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function requestIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? "unknown";
}

export function enforceRateLimit(request: Request, scope: string, limit = 10, windowMs = 60_000) {
  const key = `${scope}:${requestIp(request)}`;
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  current.count += 1;
  if (current.count > limit) throw new ApiError("RATE_LIMITED", "Too many requests. Retry after the rate limit window.", 429);
}

export function requireInternalApiKey(request: Request) {
  const expected = process.env.INTERNAL_API_KEY?.trim();
  if (!expected) throw new ApiError("ENDPOINT_DISABLED", "This platform-funded endpoint is disabled.", 404);
  const supplied = request.headers.get("x-agent-fun-api-key")?.trim();
  if (!supplied || supplied !== expected) throw new ApiError("UNAUTHORIZED", "Valid platform authorization is required.", 401);
}
