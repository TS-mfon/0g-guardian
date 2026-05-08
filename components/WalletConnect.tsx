"use client";

import { useState } from "react";
import { ethers } from "ethers";
import { connectWallet } from "@/lib/wallet";

export function WalletConnect({ compact = false }: { compact?: boolean }) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function connect() {
    setBusy(true);
    setStatus("Opening wallet...");
    try {
      const { provider, address: connectedAddress } = await connectWallet();
      const rawBalance = await provider.getBalance(connectedAddress);
      setAddress(connectedAddress);
      setBalance(Number(ethers.formatEther(rawBalance)).toLocaleString(undefined, { maximumFractionDigits: 4 }));
      setStatus("Ready to pay 0G network and storage fees.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : String(error));
    } finally {
      setBusy(false);
    }
  }

  if (compact) {
    return (
      <button className="wallet-pill" type="button" onClick={connect} disabled={busy}>
        <span>{address ? "Wallet connected" : "Connect wallet"}</span>
        <strong>{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "0G"}</strong>
      </button>
    );
  }

  return (
    <section className="wallet-card">
      <div>
        <span className="section-kicker">Wallet payments</span>
        <h2>Connect a wallet to pay for 0G services.</h2>
        <p>
          Your wallet signs 0G Chain receipts and pays network costs for Storage uploads, DA commitments,
          and guardian registration when contracts are configured.
        </p>
      </div>
      <div className="wallet-actions">
        <button className="primary-button" type="button" onClick={connect} disabled={busy}>
          {busy ? "Connecting..." : address ? "Reconnect wallet" : "Connect wallet"}
        </button>
        <div className="wallet-readout">
          <span>{address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "No wallet connected"}</span>
          <strong>{balance ? `${balance} 0G` : "Balance pending"}</strong>
        </div>
      </div>
      {status ? <p className="wallet-status">{status}</p> : null}
    </section>
  );
}
