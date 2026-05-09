"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { agentFunCoreContract } from "@/lib/wallet";

export function AgentActions({ agentId }: { agentId: string }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");

  async function buyKeys() {
    setBusy("buy");
    setStatus("Pricing keys...");
    try {
      const contract = await agentFunCoreContract();
      const price = await contract.getBuyPrice(BigInt(agentId), 1n);
      setStatus("Sign wallet transaction to buy 1 agent key.");
      const tx = await contract.buyKeys(BigInt(agentId), 1n, { value: price });
      await tx.wait();
      setStatus(`Bought 1 key. Tx ${tx.hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy("");
    }
  }

  async function sellKeys() {
    setBusy("sell");
    setStatus("Pricing sale...");
    try {
      const contract = await agentFunCoreContract();
      const price = await contract.getSellPrice(BigInt(agentId), 1n);
      setStatus("Sign wallet transaction to sell 1 agent key.");
      const tx = await contract.sellKeys(BigInt(agentId), 1n, price);
      await tx.wait();
      setStatus(`Sold 1 key for ${ethers.formatEther(price)} 0G. Tx ${tx.hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy("");
    }
  }

  async function claim() {
    setBusy("claim");
    setStatus("Sign wallet transaction to claim revenue.");
    try {
      const contract = await agentFunCoreContract();
      const tx = await contract.claimRevenue();
      await tx.wait();
      setStatus(`Revenue claimed. Tx ${tx.hash}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="action-row">
      <button className="primary-button" onClick={buyKeys} disabled={!!busy}>{busy === "buy" ? "Buying..." : "Buy 1 key"}</button>
      <button className="secondary-button" onClick={sellKeys} disabled={!!busy}>{busy === "sell" ? "Selling..." : "Sell 1 key"}</button>
      <button className="secondary-button" onClick={claim} disabled={!!busy}>{busy === "claim" ? "Claiming..." : "Claim revenue"}</button>
      {status ? <p className="status-line">{status}</p> : null}
    </div>
  );
}
