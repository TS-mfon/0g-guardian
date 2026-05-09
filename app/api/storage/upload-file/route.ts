import { NextResponse } from "next/server";
import { uploadBytesTo0GFromServer } from "@/lib/storage-server";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file." }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File is too large." }, { status: 400 });
  }
  const encoded = new Uint8Array(await file.arrayBuffer());
  return NextResponse.json(await uploadBytesTo0GFromServer(encoded));
}
