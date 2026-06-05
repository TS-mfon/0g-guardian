import { NextResponse } from "next/server";
import { ZodError, ZodSchema } from "zod";

export class ApiError extends Error {
  constructor(public code: string, message: string, public status = 400) {
    super(message);
  }
}

export async function readJson(request: Request, maxBytes = 128_000) {
  const raw = await request.text();
  if (raw.length > maxBytes) throw new ApiError("PAYLOAD_TOO_LARGE", "Request payload is too large.", 413);
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new ApiError("BAD_JSON", "Request body must be valid JSON.", 400);
  }
}

export async function readSchema<T>(request: Request, schema: ZodSchema<T>, maxBytes?: number) {
  return schema.parse(await readJson(request, maxBytes));
}

export function apiError(error: unknown, fallback = "Request failed.") {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: { code: error.code, message: error.message } }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: { code: "VALIDATION_FAILED", message: error.issues[0]?.message ?? "Invalid request payload." } },
      { status: 400 }
    );
  }
  const message = error instanceof Error ? error.message : fallback;
  const safeMessage = message.length > 240 ? fallback : message;
  return NextResponse.json({ error: { code: "REQUEST_FAILED", message: safeMessage } }, { status: 500 });
}
