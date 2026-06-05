"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ethers } from "ethers";
import { AgentAvatar } from "@/components/AgentAvatar";
import { AgentView, TaskView } from "@/lib/agentfun";
import { getUserMessage } from "@/lib/errors";
import { agentFunCoreContract, getConnectedWallet, wantsWalletReconnect } from "@/lib/wallet";

const pendingStatuses = new Set([1, 2]);

export function PortfolioSummary({ initialAgents, initialTasks }: { initialAgents: AgentView[]; initialTasks: TaskView[] }) {
  const [address, setAddress] = useState("");
  const [claimable, setClaimable] = useState("");
  const [keyPositions, setKeyPositions] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");

  async function refresh() {
    const snapshot = await getConnectedWallet();
    setAddress(snapshot.address);
    if (!snapshot.address) return;
    try {
      const contract = await agentFunCoreContract();
      const [revenue, positions] = await Promise.all([
        contract.claimable(snapshot.address),
        Promise.all(initialAgents.map(async (agent) => [agent.id, (await contract.keyBalance(BigInt(agent.id), snapshot.address)).toString()] as const))
      ]);
      setClaimable(ethers.formatEther(revenue));
      setKeyPositions(Object.fromEntries(positions));
    } catch {
      setClaimable("");
      setKeyPositions({});
    }
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

  async function setActive(agentId: string, active: boolean) {
    setBusy(`active-${agentId}`);
    setStatus(active ? "Activating agent..." : "Pausing agent...");
    try {
      const contract = await agentFunCoreContract();
      const tx = await contract.setAgentActive(BigInt(agentId), active);
      await tx.wait();
      setStatus(active ? "Agent activated. Refreshing on-chain state may take a moment." : "Agent paused. Refreshing on-chain state may take a moment.");
    } catch (error) {
      setStatus(getUserMessage(error, "Could not update agent status."));
    } finally {
      setBusy("");
    }
  }

  async function claimRevenue() {
    setBusy("claim");
    setStatus("Claiming revenue...");
    try {
      const contract = await agentFunCoreContract();
      const tx = await contract.claimRevenue();
      await tx.wait();
      await refresh();
      setStatus(`Revenue claimed. Tx ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}.`);
    } catch (error) {
      setStatus(getUserMessage(error, "Revenue claim failed."));
    } finally {
      setBusy("");
    }
  }

  const createdAgents = address ? initialAgents.filter((agent) => agent.creator.toLowerCase() === address.toLowerCase()) : [];
  const heldAgents = address ? initialAgents.filter((agent) => Number(keyPositions[agent.id] ?? "0") > 0) : [];
  const pendingTasks = initialTasks.filter((task) => pendingStatuses.has(task.status));
  const walletLabel = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Connect wallet";

  return (
    <>
      <section className="portfolio-grid portfolio-command-grid">
        <div><span>Wallet</span><strong>{walletLabel}</strong><p>Management actions unlock after connecting the creator wallet.</p></div>
        <div><span>Agents launched</span><strong>{address ? createdAgents.length : "Connect"}</strong><p>Filtered from confirmed AgentLaunched records.</p></div>
        <div><span>Keys held</span><strong>{address ? heldAgents.length : "Connect"}</strong><p>Your key positions are read from `keyBalance`.</p></div>
        <div><span>Claimable revenue</span><strong>{claimable ? `${claimable} 0G` : address ? "0.0 0G" : "Connect"}</strong><p>Creator and protocol revenue settles through `claimable`.</p></div>
      </section>

      <section className="creator-console-grid">
        <div className="glass-card creator-console-main">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">Creator console</span>
              <h2>Agents launched</h2>
            </div>
            <button className="secondary-button" onClick={claimRevenue} disabled={!address || !!busy}>
              {busy === "claim" ? "Claiming..." : "Claim revenue"}
            </button>
          </div>
          {!address ? <p className="empty-copy">Connect your wallet to manage agents you created on 0G Chain.</p> : null}
          {address && !createdAgents.length ? <p className="empty-copy">No created agents found for this wallet yet.</p> : null}
          <div className="managed-agent-list">
            {createdAgents.map((agent) => (
              <article className="managed-agent-card" key={agent.id}>
                <AgentAvatar name={agent.name} category={agent.category} size="sm" />
                <div>
                  <span>{agent.category} · Agent #{agent.id}</span>
                  <h3>{agent.name} <em>${agent.symbol}</em></h3>
                  <p>Readiness {agent.readinessScore}%. Market cap {agent.marketCap} 0G. {agent.taskCount} paid tasks.</p>
                  <div className="managed-actions">
                    <Link className="proof-link" href={`/agents/${agent.id}`}>Manage</Link>
                    <Link className="proof-link" href={`/agents/${agent.id}#creator-console`}>Activate compute</Link>
                    <button className="secondary-button" disabled={!!busy} onClick={() => setActive(agent.id, !agent.active)}>
                      {busy === `active-${agent.id}` ? "Updating..." : agent.active ? "Pause" : "Activate"}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <aside className="glass-card creator-console-side">
          <span className="section-kicker">Onboarding</span>
          <h2>Creator checklist</h2>
          <ul className="checklist">
            <li>Launch agent and mint Agent ID</li>
            <li>Activate 0G Compute from the agent page</li>
            <li>Run one paid task test</li>
            <li>Share the agent link</li>
            <li>Claim revenue when task/key fees accrue</li>
          </ul>
          <span className="section-kicker">Pending tasks</span>
          <div className="pending-task-list">
            {pendingTasks.length ? pendingTasks.slice(0, 5).map((task) => (
              <Link href={`/agents/${task.agentId}`} key={task.id}>
                <strong>Task #{task.id}</strong>
                <span>Agent #{task.agentId} · {task.fee} 0G escrowed</span>
              </Link>
            )) : <p>No pending tasks right now.</p>}
          </div>
        </aside>
      </section>
      {status ? <p className="status-line portfolio-status">{status}</p> : null}
    </>
  );
}
