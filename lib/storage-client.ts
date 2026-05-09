export interface ClientStorageResult {
  rootHash: string;
  txHash?: string;
  sizeBytes: number;
}

export async function uploadJsonTo0GFromBrowser(payload: unknown, _signer: unknown): Promise<ClientStorageResult> {
  return uploadJsonThroughApi(payload);
}

export async function uploadFileTo0GFromBrowser(file: File, _signer: unknown): Promise<ClientStorageResult> {
  return uploadFileThroughApi(file);
}

async function uploadJsonThroughApi(payload: unknown) {
  const response = await fetch("/api/storage/upload-json", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await response.text());
  const body = await response.json();
  if (body?.mode !== "0g-storage" || !body?.rootHash) throw new Error("0G Storage upload failed.");
  return body as ClientStorageResult;
}

async function uploadFileThroughApi(file: File) {
  const data = new FormData();
  data.set("file", file);
  const response = await fetch("/api/storage/upload-file", { method: "POST", body: data });
  if (!response.ok) throw new Error(await response.text());
  const body = await response.json();
  if (body?.mode !== "0g-storage" || !body?.rootHash) throw new Error("0G Storage upload failed.");
  return body as ClientStorageResult;
}
