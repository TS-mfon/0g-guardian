import { ContractTransactionReceipt, ethers } from "ethers";
import { agentFunCoreAbi } from "@shared/index";

const taskInterface = new ethers.Interface(agentFunCoreAbi);

export function getCreatedTaskId(receipt: ContractTransactionReceipt | null) {
  if (!receipt) throw new Error("Task transaction completed without a receipt.");
  for (const log of receipt.logs) {
    try {
      const parsed = taskInterface.parseLog(log);
      if (parsed?.name === "TaskCreated") return BigInt(parsed.args.taskId).toString();
    } catch {
      // Ignore logs emitted by other contracts.
    }
  }
  throw new Error("Confirmed transaction did not emit TaskCreated.");
}

export function failedReadinessMessage(readiness: { checks?: Record<string, { ok?: boolean; message?: string }> } | null) {
  const failed = Object.values(readiness?.checks ?? {}).find((item) => !item.ok);
  return failed?.message ?? "Execution readiness could not be verified. No payment was requested.";
}
