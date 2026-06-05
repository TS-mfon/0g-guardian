"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { AgentView } from "@/lib/agentfun";
import { getUserMessage } from "@/lib/errors";
import { agentFunCoreContract, getConnectedWallet, wantsWalletReconnect } from "@/lib/wallet";

export function AgentActions({ agent }: { agent: AgentView }) {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const [walletBalance, setWalletBalance] = useState("");

  async function refreshPosition() {
    try {
      const wallet = await getConnectedWallet();
      if (!wallet.address) return;
      const contract = await agentFunCoreContract();
      const keys = await contract.keyBalance(BigInt(agent.id), wallet.address);
      setWalletBalance(keys.toString());
    } catch {
      setWalletBalance("");
    }
  }

  useEffect(() => {
    if (wantsWalletReconnect()) void refreshPosition();
    const onWallet = () => void refreshPosition();
    window.addEventListener("agentfun:wallet", onWallet);
    return () => window.removeEventListener("agentfun:wallet", onWallet);
  }, [agent.id]);

  async function buyKeys() {
    setBusy("buy");
    setStatus("Pricing keys...");
    try {
      const contract = await agentFunCoreContract();
      const price = await contract.getBuyPrice(BigInt(agent.id), 1n);
      setStatus("Sign wallet transaction to buy 1 agent key.");
      const tx = await contract.buyKeys(BigInt(agent.id), 1n, { value: price });
      await tx.wait();
      await refreshPosition();
      setStatus(`Bought 1 key. The next key price increased on-chain. Tx ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}.`);
    } catch (error) {
      setStatus(getUserMessage(error, "Key purchase failed. Please retry."));
    } finally {
      setBusy("");
    }
  }

  async function sellKeys() {
    setBusy("sell");
    setStatus("Pricing sale...");
    try {
      const contract = await agentFunCoreContract();
      const price = await contract.getSellPrice(BigInt(agent.id), 1n);
      setStatus("Sign wallet transaction to sell 1 agent key.");
      const tx = await contract.sellKeys(BigInt(agent.id), 1n, price);
      await tx.wait();
      await refreshPosition();
      setStatus(`Sold 1 key for ${ethers.formatEther(price)} 0G. Tx ${tx.hash}`);
    } catch (error) {
      setStatus(getUserMessage(error, "Key sale failed. Please retry."));
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="action-row key-market-actions">
      <div className="key-market-panel">
        <div><span>Next key</span><strong>{agent.currentKeyPrice} 0G</strong></div>
        <div><span>Sell quote</span><strong>{agent.sellQuote} 0G</strong></div>
        <div><span>Market cap</span><strong>{agent.marketCap} 0G</strong></div>
        <div><span>Your keys</span><strong>{walletBalance || "Connect wallet"}</strong></div>
        <div><span>Task volume</span><strong>{agent.taskCount}</strong></div>
      </div>
      <button className="primary-button" onClick={buyKeys} disabled={!!busy}>{busy === "buy" ? "Buying..." : "Buy 1 key"}</button>
      <button className="secondary-button" onClick={sellKeys} disabled={!!busy}>{busy === "sell" ? "Selling..." : "Sell 1 key"}</button>
      {status ? <p className="status-line">{status}</p> : null}
    </div>
  );
}
