"use client";

import { useEffect, useState } from "react";
import { getConnectedWallet, wantsWalletReconnect } from "@/lib/wallet";

export function PortfolioSummary() {
  const [address, setAddress] = useState("");

  async function refresh() {
    const snapshot = await getConnectedWallet();
    setAddress(snapshot.address);
  }

  useEffect(() => {
    if (wantsWalletReconnect()) void refresh();
    const onWallet = () => void refresh();
    const ethereum = window.ethereum as (typeof window.ethereum & {
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    });
    window.addEventListener("agentfun:wallet", onWallet);
    ethereum?.on?.("accountsChanged", onWallet);
    return () => {
      window.removeEventListener("agentfun:wallet", onWallet);
      ethereum?.removeListener?.("accountsChanged", onWallet);
    };
  }, []);

  const heading = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Connect wallet";
  return (
    <section className="portfolio-grid">
      <div><span>Agents launched</span><strong>{heading}</strong><p>Your created agents will appear from confirmed 0G Chain activity.</p></div>
      <div><span>Keys owned</span><strong>{heading}</strong><p>Track positions in agents you support or use.</p></div>
      <div><span>Revenue available</span><strong>{heading}</strong><p>Claim creator revenue from tasks and key activity.</p></div>
    </section>
  );
}
