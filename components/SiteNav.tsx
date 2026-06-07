"use client";

import Link from "next/link";
import { ZeroGNetworkKey } from "@/lib/config";
import { useWallet } from "./WalletProvider";
import { WalletConnect } from "./WalletConnect";

function NetworkSelect() {
  const wallet = useWallet();
  return (
    <select
      className="nav-network-select"
      value={wallet.network}
      onChange={(e) => void wallet.switchNetwork(e.target.value as ZeroGNetworkKey)}
      disabled={wallet.busy}
      aria-label="Select network"
    >
      <option value="mainnet">0G Mainnet</option>
      <option value="testnet">0G Galileo</option>
    </select>
  );
}

export function SiteNav() {
  return (
    <header className="site-nav">
      <Link className="nav-brand" href="/">Agent.fun</Link>
      <nav>
        <Link href="/launch">Launch</Link>
        <Link href="/agents">Agents</Link>
        <Link href="/arena">Arena</Link>
        <Link href="/portfolio">Portfolio</Link>
        <Link href="/proofs">Proofs</Link>
        <Link href="/docs">Docs</Link>
      </nav>
      <div className="nav-controls">
        <NetworkSelect />
        <WalletConnect compact />
      </div>
    </header>
  );
}
