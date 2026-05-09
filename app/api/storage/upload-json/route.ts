import { NextResponse } from "next/server";
import { uploadBytesTo0GFromServer } from "@/lib/storage-server";

export async function POST(request: Request) {
  const payload = await request.json();
  const encoded = new TextEncoder().encode(JSON.stringify(payload, null, 2));
  return NextResponse.json(await uploadBytesTo0GFromServer(encoded));
}
