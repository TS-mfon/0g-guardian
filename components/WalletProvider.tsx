"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { getUserMessage } from "@/lib/errors";
import {
  connectWallet,
  forgetWallet,
  getConnectedWallet,
  wantsWalletReconnect
} from "@/lib/wallet";

interface WalletState {
  address: string;
  balance: string;
  status: string;
  busy: boolean;
  connect: () => Promise<void>;
  refresh: () => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await getConnectedWallet();
      setAddress(snapshot.address);
      setBalance(snapshot.balance ? Number(snapshot.balance).toLocaleString(undefined, { maximumFractionDigits: 4 }) : "");
      setStatus(snapshot.address && !snapshot.isCorrectNetwork ? `Switch to ${snapshot.selectedNetwork.label}.` : "");
    } catch (error) {
      // Preserve the last confirmed account during transient RPC failures. Account
      // removal is handled explicitly by the accountsChanged event below.
      setStatus(getUserMessage(error, "Wallet RPC is temporarily unavailable. Keeping the last connected account."));
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

  const disconnect = useCallback(() => {
    forgetWallet();
    setAddress("");
    setBalance("");
    setStatus("");
  }, []);

  useEffect(() => {
    if (wantsWalletReconnect()) void refresh();
    const onWallet = () => void refresh();
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
    ethereum?.on?.("accountsChanged", onAccounts);
    ethereum?.on?.("chainChanged", onWallet);
    return () => {
      window.removeEventListener("agentfun:wallet", onWallet);
      ethereum?.removeListener?.("accountsChanged", onAccounts);
      ethereum?.removeListener?.("chainChanged", onWallet);
    };
  }, [refresh]);

  const value = useMemo(() => ({ address, balance, status, busy, connect, refresh, disconnect }), [
    address, balance, status, busy, connect, refresh, disconnect
  ]);
  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider.");
  return value;
}
