"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { ZeroGNetworkKey } from "@/lib/config";
import { getUserMessage } from "@/lib/errors";
import {
  connectWallet,
  ensureZeroGNetwork,
  forgetWallet,
  getBrowserProvider,
  getConnectedWallet,
  getSelectedNetworkKey,
  setSelectedNetworkKey,
  wantsWalletReconnect
} from "@/lib/wallet";

interface WalletState {
  address: string;
  balance: string;
  network: ZeroGNetworkKey;
  status: string;
  busy: boolean;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
  switchNetwork: (network: ZeroGNetworkKey) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [network, setNetwork] = useState<ZeroGNetworkKey>("mainnet");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await getConnectedWallet();
      setAddress(snapshot.address);
      setBalance(snapshot.balance ? Number(snapshot.balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "");
      setStatus(snapshot.address && !snapshot.isCorrectNetwork ? `Switch to ${snapshot.selectedNetwork.label}.` : "");
    } catch {
      setAddress("");
      setBalance("");
    }
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    setStatus("Opening wallet...");
    try {
      const { provider, address: nextAddress } = await connectWallet();
      setAddress(nextAddress);
      setBalance(Number(ethers.formatEther(await provider.getBalance(nextAddress))).toLocaleString(undefined, { maximumFractionDigits: 4 }));
      setStatus("Wallet ready.");
    } catch (error) {
      setStatus(getUserMessage(error, "Wallet connection failed."));
    } finally {
      setBusy(false);
    }
  }, []);

  const switchNetwork = useCallback(async (next: ZeroGNetworkKey) => {
    setBusy(true);
    setSelectedNetworkKey(next);
    setNetwork(next);
    try {
      if (address || wantsWalletReconnect()) {
        const provider = await getBrowserProvider();
        await ensureZeroGNetwork(provider);
        await refresh();
      }
      window.location.reload();
    } catch (error) {
      setStatus(getUserMessage(error, "Network switch failed."));
    } finally {
      setBusy(false);
    }
  }, [address, refresh]);

  const disconnect = useCallback(() => {
    forgetWallet();
    setAddress("");
    setBalance("");
    setStatus("");
  }, []);

  useEffect(() => {
    setNetwork(getSelectedNetworkKey());
    if (wantsWalletReconnect()) void refresh();
    const onWallet = () => void refresh();
    const onNetwork = () => setNetwork(getSelectedNetworkKey());
    const onAccounts = (accounts: unknown) => {
      if (Array.isArray(accounts) && accounts[0]) void refresh();
      else {
        setAddress("");
        setBalance("");
      }
    };
    const ethereum = window.ethereum as (typeof window.ethereum & {
      on?: (event: string, handler: (...args: any[]) => void) => void;
      removeListener?: (event: string, handler: (...args: any[]) => void) => void;
    });
    window.addEventListener("agentfun:wallet", onWallet);
    window.addEventListener("agentfun:network", onNetwork);
    ethereum?.on?.("accountsChanged", onAccounts);
    ethereum?.on?.("chainChanged", onWallet);
    return () => {
      window.removeEventListener("agentfun:wallet", onWallet);
      window.removeEventListener("agentfun:network", onNetwork);
      ethereum?.removeListener?.("accountsChanged", onAccounts);
      ethereum?.removeListener?.("chainChanged", onWallet);
    };
  }, [refresh]);

  const value = useMemo(() => ({ address, balance, network, status, busy, connect, refresh, switchNetwork, disconnect }), [
    address, balance, network, status, busy, connect, refresh, switchNetwork, disconnect
  ]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider.");
  return value;
}
