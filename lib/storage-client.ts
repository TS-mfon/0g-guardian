export interface ClientStorageResult {
  rootHash: string;
  txHash?: string;
  sizeBytes: number;
}

export async function uploadJsonTo0GFromBrowser(payload: unknown, _signer: unknown, network = "mainnet"): Promise<ClientStorageResult> {
  return uploadJsonThroughApi(payload, network);
}

async function uploadJsonThroughApi(payload: unknown, network: string) {
  const response = await fetch(`/api/storage/upload-json?network=${encodeURIComponent(network)}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error(await response.text());
  const body = await response.json();
  if (body?.mode !== "0g-storage" || !body?.rootHash) throw new Error("0G Storage upload failed.");
  return body as ClientStorageResult;
}
