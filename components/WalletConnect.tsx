"use client";

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { getUserMessage } from "@/lib/errors";
import {
  connectWallet,
  forgetWallet,
  getConnectedWallet,
  getSelectedNetworkKey,
  getSelectedNetworkLabel,
  setSelectedNetworkKey,
  wantsWalletReconnect
} from "@/lib/wallet";
import { ZeroGNetworkKey } from "@/lib/config";

export function WalletConnect({ compact = false }: { compact?: boolean }) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [network, setNetwork] = useState<ZeroGNetworkKey>("mainnet");

  async function hydrateWallet(silent = true) {
    try {
      const snapshot = await getConnectedWallet();
      if (!snapshot.address) {
        if (!silent) setStatus("No wallet connected.");
        return;
      }
      setAddress(snapshot.address);
      setBalance(snapshot.balance ? Number(snapshot.balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "");
      if (!snapshot.isCorrectNetwork) {
        setStatus(`Switch to ${snapshot.selectedNetwork.label} to use contract actions.`);
        return;
      }
      if (!silent) setStatus(`Ready on ${getSelectedNetworkLabel()}.`);
    } catch (error) {
      if (!silent) setStatus(getUserMessage(error, "Wallet connection failed. Please retry."));
    }
  }

  useEffect(() => {
    setNetwork(getSelectedNetworkKey());
    if (wantsWalletReconnect()) void hydrateWallet(true);
    const onWallet = () => void hydrateWallet(true);
    const onNetwork = () => {
      setNetwork(getSelectedNetworkKey());
      if (wantsWalletReconnect()) void hydrateWallet(true);
    };
    const onAccounts = (accounts: unknown) => {
      const next = Array.isArray(accounts) && accounts[0] ? String(accounts[0]) : "";
      if (!next) {
        forgetWallet();
        setAddress("");
        setBalance("");
        setStatus("");
        return;
      }
      void hydrateWallet(true);
    };
    window.addEventListener("agentfun:wallet", onWallet);
    window.addEventListener("agentfun:network", onNetwork);
    const ethereum = window.ethereum as (typeof window.ethereum & {
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    });
    ethereum?.on?.("accountsChanged", onAccounts);
    ethereum?.on?.("chainChanged", onWallet);
    return () => {
      window.removeEventListener("agentfun:wallet", onWallet);
      window.removeEventListener("agentfun:network", onNetwork);
      ethereum?.removeListener?.("accountsChanged", onAccounts);
      ethereum?.removeListener?.("chainChanged", onWallet);
    };
  }, []);

  async function connect() {
    setBusy(true);
    setStatus("Opening wallet...");
    try {
      const { provider, address: connectedAddress } = await connectWallet();
      const rawBalance = await provider.getBalance(connectedAddress);
      setAddress(connectedAddress);
      setBalance(Number(ethers.formatEther(rawBalance)).toLocaleString(undefined, { maximumFractionDigits: 4 }));
      setStatus(`Ready on ${getSelectedNetworkLabel()}.`);
    } catch (error) {
      setStatus(getUserMessage(error, "Wallet connection failed. Please retry."));
    } finally {
      setBusy(false);
    }
  }

  async function changeNetwork(value: ZeroGNetworkKey) {
    setSelectedNetworkKey(value);
    setNetwork(value);
    setStatus(address || wantsWalletReconnect() ? "Network selected. Click switch/connect to use it." : `Network set to ${value === "mainnet" ? "0G Mainnet" : "0G Galileo"}.`);
    if (address || wantsWalletReconnect()) void hydrateWallet(true);
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
          Your wallet signs agent launches, key trades, paid tasks, and revenue claims on 0G Chain.
        </p>
      </div>
      <div className="wallet-actions">
        <label className="network-select">
          Network
          <select value={network} onChange={(event) => void changeNetwork(event.target.value as ZeroGNetworkKey)}>
            <option value="mainnet">0G Mainnet</option>
            <option value="testnet">0G Galileo</option>
          </select>
        </label>
        <button className="primary-button" type="button" onClick={connect} disabled={busy}>
          {busy ? "Connecting..." : address ? "Switch / refresh wallet" : "Connect wallet"}
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
