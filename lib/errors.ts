export function getUserMessage(error: unknown, fallback = "Something went wrong. Please try again.") {
  const anyError = error as {
    code?: string | number;
    reason?: string;
    shortMessage?: string;
    message?: string;
    info?: { error?: { code?: string | number; message?: string } };
  };
  const code = anyError?.code ?? anyError?.info?.error?.code;
  let parsedMessage = "";
  if (typeof anyError?.message === "string" && anyError.message.trim().startsWith("{")) {
    try {
      const parsed = JSON.parse(anyError.message);
      parsedMessage = parsed?.error?.message ?? parsed?.message ?? "";
    } catch {
      parsedMessage = "";
    }
  }

  const text = [
    anyError?.reason,
    anyError?.shortMessage,
    anyError?.message,
    anyError?.info?.error?.message,
    parsedMessage
  ].filter(Boolean).join(" ").toLowerCase();

  if (code === 4001 || code === "ACTION_REJECTED" || text.includes("user rejected") || text.includes("user denied")) {
    return text.includes("wallet") && !text.includes("transaction")
      ? "User rejected the wallet request."
      : "User rejected the transaction.";
  }

  if (text.includes("insufficient funds")) return "Insufficient 0G balance for this transaction.";
  if (text.includes("wrong network") || text.includes("switch to")) return "Switch to the selected 0G network.";
  if (text.includes("missing revert data") || text.includes("call_exception")) return "The 0G RPC call failed. Check your wallet network and retry — the node may be temporarily overloaded.";
  if (text.includes("storage")) return "0G Storage upload failed. Please retry.";
  if (text.includes("creator has not linked") || text.includes("link compute")) return "This creator has not linked 0G Compute yet.";
  if (text.includes("compute is not configured")) return "0G Compute is not configured yet. The task will stay pending.";
  if (text.includes("insufficient_balance") || text.includes("402")) return "0G Compute balance is exhausted. The creator must top up compute.";
  if (text.includes("only the agent creator")) return "Only the agent creator can perform this action.";
  if (text.includes("agent is not active") || text.includes("agent paused")) return "This agent is paused and cannot accept tasks right now.";
  if (text.includes("da is not configured") || text.includes("da submission")) return "0G DA is not configured yet. The task will stay pending.";
  if (text.includes("not configured yet") || text.includes("not deployed yet")) return "Launch contracts are not configured for this network. Check that you are on the right network.";
  if (text.includes("no injected wallet") || text.includes("install a wallet")) return "No wallet detected. Install MetaMask or a compatible EVM wallet.";
  if (text.includes("network changed") || text.includes("underlying network changed")) return "Network changed mid-transaction. Reconnect your wallet and retry.";
  if (parsedMessage) return parsedMessage;

  return fallback;
}
