"use client";

import { useCallback, useEffect, useState } from "react";
import { ethers } from "ethers";
import { getUserMessage } from "@/lib/errors";
import { agentFunCoreContract, agentFunCoreReadContract, getSelectedNetworkKey } from "@/lib/wallet";
import { useWallet } from "./WalletProvider";

export function CreatorComputeKeyPanel({
  agentId,
  creator,
  computeActive
}: {
  agentId: string;
  creator: string;
  category?: string;
  computeActive?: boolean;
}) {
  const wallet = useWallet();
  const [active, setActive] = useState(Boolean(computeActive));
  const [activationFee, setActivationFee] = useState("");
  const [claimable, setClaimable] = useState("");
  const [activationStatus, setActivationStatus] = useState("");
  const [claimStatus, setClaimStatus] = useState("");
  const [activationBusy, setActivationBusy] = useState(false);
  const [claimBusy, setClaimBusy] = useState(false);
  const isCreator = Boolean(wallet.address) && wallet.address.toLowerCase() === creator.toLowerCase();

  const refresh = useCallback(async () => {
    if (!isCreator) return;
    try {
      const contract = await agentFunCoreReadContract(getSelectedNetworkKey());
      const [agent, fee, earnings] = await Promise.all([
        contract.getAgent(BigInt(agentId)),
        contract.activationFee(),
        contract.agentCreatorClaimable(BigInt(agentId))
      ]);
      setActive(Boolean(agent.computeActive));
      setActivationFee(ethers.formatEther(fee));
      setClaimable(ethers.formatEther(earnings));
    } catch (error) {
      setActivationStatus(getUserMessage(error, "Could not refresh creator controls."));
    }
  }, [agentId, isCreator]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function activateCompute() {
    setActivationBusy(true);
    setActivationStatus("Preparing activation transaction...");
    try {
      const contract = await agentFunCoreContract(getSelectedNetworkKey());
      const fee = await contract.activationFee();
      setActivationStatus(`Sign the ${ethers.formatEther(fee)} 0G activation transaction.`);
      const tx = await contract.activateAgent(BigInt(agentId), { value: fee });
      setActivationStatus("Activation submitted. Waiting for confirmation...");
      await tx.wait();
      setActive(true);
      await refresh();
      setActivationStatus(`Task execution activated. Transaction ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}.`);
    } catch (error) {
      setActivationStatus(getUserMessage(error, "Compute activation failed."));
    } finally {
      setActivationBusy(false);
    }
  }

  async function claimEarnings() {
    setClaimBusy(true);
    setClaimStatus("Preparing creator revenue claim...");
    try {
      const contract = await agentFunCoreContract(getSelectedNetworkKey());
      const value = await contract.agentCreatorClaimable(BigInt(agentId));
      if (value === 0n) throw new Error("No claimable earnings yet.");
      const tx = await contract.claimAgentRevenue(BigInt(agentId));
      await tx.wait();
      await refresh();
      setClaimStatus(`Revenue claimed. Transaction ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}.`);
    } catch (error) {
      setClaimStatus(getUserMessage(error, "Creator revenue claim failed."));
    } finally {
      setClaimBusy(false);
    }
  }

  if (!isCreator) return null;

  return (
    <section id="creator-console" className="glass-card creator-console-panel">
      <div className="section-heading-row">
        <div>
          <span className="section-kicker">Creator console</span>
          <h2>{active ? "Agent execution is active" : "Activate agent execution"}</h2>
          <p>Only your creator wallet can see and use these controls.</p>
        </div>
        <span className={active ? "status-badge success" : "status-badge pending"}>{active ? "Active" : "Activation required"}</span>
      </div>
      <div className="creator-action-grid">
        <article>
          <span>Compute activation</span>
          <strong>{activationFee ? `${activationFee} 0G` : "Loading live fee..."}</strong>
          <p>Seeds the platform compute treasury and enables user-funded paid tasks.</p>
          <button type="button" className="primary-button" onClick={activateCompute} disabled={active || activationBusy || !activationFee}>
            {activationBusy ? "Activating..." : active ? "Compute active" : "Activate compute"}
          </button>
          {activationStatus ? <p className="status-line">{activationStatus}</p> : null}
        </article>
        <article>
          <span>Private creator revenue</span>
          <strong>{claimable ? `${claimable} 0G` : "0.0 0G"}</strong>
          <p>Revenue earned by this agent from keys and completed paid tasks.</p>
          <button type="button" className="secondary-button" onClick={claimEarnings} disabled={claimBusy || !Number(claimable)}>
            {claimBusy ? "Claiming..." : "Claim revenue"}
          </button>
          {claimStatus ? <p className="status-line">{claimStatus}</p> : null}
        </article>
      </div>
    </section>
  );
}
