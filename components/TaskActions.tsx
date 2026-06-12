"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "./WalletProvider";
import { agentFunCoreContract } from "@/lib/wallet";
import { getUserMessage } from "@/lib/errors";

export function TaskActions({ taskId, requester, status, deadline, rating }: {
  taskId: string;
  requester: string;
  status: number;
  deadline: string;
  rating: number;
}) {
  const router = useRouter();
  const { address } = useWallet();
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const owner = Boolean(address && address.toLowerCase() === requester.toLowerCase());
  const expired = Number(deadline) <= Math.floor(Date.now() / 1000);

  async function retry() {
    setBusy("retry");
    setMessage("Retrying execution from the committed prompt root...");
    try {
      const response = await fetch("/api/tasks/execute", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ taskId, retry: true })
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message ?? "Execution retry failed.");
      setMessage(body?.status === "executing" ? "Execution is already in progress." : "Execution retry completed.");
      router.refresh();
    } catch (error) {
      setMessage(getUserMessage(error, "Task remains paid and pending. Retry later or refund after the deadline."));
    } finally {
      setBusy("");
    }
  }

  async function refund() {
    setBusy("refund");
    setMessage("Requesting the full expired-task refund...");
    try {
      const contract = await agentFunCoreContract();
      const tx = await contract.cancelExpiredTask(BigInt(taskId));
      await tx.wait();
      setMessage(`Refund confirmed in ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}.`);
      router.refresh();
    } catch (error) {
      setMessage(getUserMessage(error, "Refund claim failed."));
    } finally {
      setBusy("");
    }
  }

  async function rate(value: number) {
    setBusy("rate");
    try {
      const contract = await agentFunCoreContract();
      const tx = await contract.rateTask(BigInt(taskId), value);
      await tx.wait();
      setMessage(`Rating ${value}/5 recorded.`);
      router.refresh();
    } catch (error) {
      setMessage(getUserMessage(error, "Rating failed."));
    } finally {
      setBusy("");
    }
  }

  if (!owner) return <p className="status-line">Connect the requester wallet to retry, refund, or rate this task.</p>;
  return (
    <div className="task-actions">
      {(status === 1 || status === 2) && !expired ? <button className="primary-button" disabled={!!busy} onClick={retry}>{busy === "retry" ? "Retrying..." : "Retry execution"}</button> : null}
      {(status === 1 || status === 2) && expired ? <button className="primary-button" disabled={!!busy} onClick={refund}>{busy === "refund" ? "Claiming..." : "Claim refund"}</button> : null}
      {status === 3 && !rating ? [1, 2, 3, 4, 5].map((value) => <button className="secondary-button" disabled={!!busy} key={value} onClick={() => rate(value)}>{value}/5</button>) : null}
      {message ? <p className="status-line" aria-live="polite">{message}</p> : null}
    </div>
  );
}
