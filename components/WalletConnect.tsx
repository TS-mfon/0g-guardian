"use client";

import { ZeroGNetworkKey } from "@/lib/config";
import { useWallet } from "./WalletProvider";

export function WalletConnect({ compact = false }: { compact?: boolean }) {
  const wallet = useWallet();

  if (compact) {
    return (
      <button
        className="wallet-pill"
        type="button"
        onClick={wallet.address ? wallet.refresh : wallet.connect}
        disabled={wallet.busy}
        title={wallet.address ? "Refresh wallet balance" : "Connect wallet"}
      >
        <span>{wallet.address ? "Connected" : "Connect wallet"}</span>
        <strong>{wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)}` : "0G"}</strong>
      </button>
    );
  }

  return (
    <section className="wallet-card">
      <div>
        <span className="section-kicker">Wallet</span>
        <h2>{wallet.address ? "Wallet ready" : "Connect to use Agent.fun"}</h2>
        <p>Sign launches, key trades, paid tasks, activations, and creator-only claims on the selected 0G network.</p>
      </div>
      <div className="wallet-actions">
        <label className="network-select">
          Network
          <select value={wallet.network} onChange={(event) => void wallet.switchNetwork(event.target.value as ZeroGNetworkKey)} disabled={wallet.busy}>
            <option value="mainnet">0G Mainnet</option>
            <option value="testnet">0G Galileo</option>
          </select>
        </label>
        <button className="primary-button" type="button" onClick={wallet.address ? wallet.refresh : wallet.connect} disabled={wallet.busy}>
          {wallet.busy ? "Working..." : wallet.address ? "Refresh wallet" : "Connect wallet"}
        </button>
        {wallet.address ? <button className="secondary-button" type="button" onClick={wallet.disconnect}>Disconnect</button> : null}
        <div className="wallet-readout">
          <span>{wallet.address ? `${wallet.address.slice(0, 8)}...${wallet.address.slice(-6)}` : "No wallet connected"}</span>
          <strong>{wallet.balance ? `${wallet.balance} 0G` : "Balance unavailable"}</strong>
        </div>
      </div>
      {wallet.status ? <p className="wallet-status">{wallet.status}</p> : null}
    </section>
  );
}
