"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ethers } from "ethers";
import { AgentAvatar } from "@/components/AgentAvatar";
import { useWallet } from "@/components/WalletProvider";
import { AgentView, TaskView } from "@/lib/agentfun";
import { getUserMessage } from "@/lib/errors";
import { agentFunCoreContract, agentFunCoreReadContract } from "@/lib/wallet";

const pendingStatuses = new Set([1, 2]);

export function PortfolioSummary({ initialAgents, initialTasks }: { initialAgents: AgentView[]; initialTasks: TaskView[] }) {
  const router = useRouter();
  const { address, refresh: refreshWallet } = useWallet();
  const [claimableByAgent, setClaimableByAgent] = useState<Record<string, string>>({});
  const [keyPositions, setKeyPositions] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState("");
  const [portfolioError, setPortfolioError] = useState("");
  const [lastUpdated, setLastUpdated] = useState("");

  async function refreshPortfolio(refreshPage = false) {
    if (!address) {
      setClaimableByAgent({});
      setKeyPositions({});
      setPortfolioError("");
      return;
    }
    setBusy((current) => current || "refresh");
    try {
      const contract = await agentFunCoreReadContract();
      const created = initialAgents.filter((agent) => agent.creator.toLowerCase() === address.toLowerCase());
      const [earnings, positions] = await Promise.all([
        Promise.all(created.map(async (agent) => [agent.id, ethers.formatEther(await contract.agentCreatorClaimable(BigInt(agent.id)))] as const)),
        Promise.all(initialAgents.map(async (agent) => [agent.id, (await contract.keyBalance(BigInt(agent.id), address)).toString()] as const))
      ]);
      setClaimableByAgent(Object.fromEntries(earnings));
      setKeyPositions(Object.fromEntries(positions));
      setPortfolioError("");
      setLastUpdated(new Date().toLocaleTimeString());
      await refreshWallet();
      if (refreshPage) router.refresh();
    } catch (error) {
      setPortfolioError(getUserMessage(error, "Could not refresh portfolio from 0G Chain. Showing the last successful snapshot."));
    } finally {
      setBusy((current) => current === "refresh" ? "" : current);
    }
  }

  useEffect(() => {
    void refreshPortfolio();
  }, [address, initialAgents]);

  async function setActive(agentId: string, active: boolean) {
    setBusy(`active-${agentId}`);
    setStatus(active ? "Activating agent..." : "Pausing agent...");
    try {
      const contract = await agentFunCoreContract();
      const tx = await contract.setAgentActive(BigInt(agentId), active);
      await tx.wait();
      await refreshPortfolio(true);
      setStatus(active ? "Agent activated. Refreshing on-chain state may take a moment." : "Agent paused. Refreshing on-chain state may take a moment.");
    } catch (error) {
      setStatus(getUserMessage(error, "Could not update agent status."));
    } finally {
      setBusy("");
    }
  }

  async function claimRevenue(agentId: string) {
    setBusy(`claim-${agentId}`);
    setStatus("Claiming creator earnings...");
    try {
      const contract = await agentFunCoreContract();
      const value = await contract.agentCreatorClaimable(BigInt(agentId));
      if (value === 0n) throw new Error("No claimable creator earnings yet.");
      const tx = await contract.claimAgentRevenue(BigInt(agentId));
      await tx.wait();
      await refreshPortfolio(true);
      setStatus(`Creator earnings claimed. Tx ${tx.hash.slice(0, 10)}...${tx.hash.slice(-6)}.`);
    } catch (error) {
      setStatus(getUserMessage(error, "Creator earnings claim failed."));
    } finally {
      setBusy("");
    }
  }

  const createdAgents = address ? initialAgents.filter((agent) => agent.creator.toLowerCase() === address.toLowerCase()) : [];
  const heldAgents = address ? initialAgents.filter((agent) => Number(keyPositions[agent.id] ?? "0") > 0) : [];
  const createdAgentIds = new Set(createdAgents.map((agent) => agent.id));
  const pendingTasks = initialTasks.filter((task) => createdAgentIds.has(task.agentId) && pendingStatuses.has(task.status));
  const totalCreatorEarnings = createdAgents.reduce((sum, agent) => sum + Number(claimableByAgent[agent.id] ?? "0"), 0);
  const walletLabel = address ? `${address.slice(0, 8)}...${address.slice(-6)}` : "Connect wallet";

  return (
    <>
      <section className="portfolio-grid portfolio-command-grid">
        <div><span>Wallet</span><strong>{walletLabel}</strong><p>Management actions unlock after connecting the creator wallet.</p></div>
        <div><span>Agents launched</span><strong>{address ? createdAgents.length : "Connect wallet"}</strong><p>Filtered from confirmed AgentLaunched records.</p></div>
        <div><span>Keys held</span><strong>{address ? heldAgents.length : "Connect"}</strong><p>Your key positions are read from `keyBalance`.</p></div>
        {createdAgents.length ? <div><span>Private creator earnings</span><strong>{totalCreatorEarnings.toLocaleString(undefined, { maximumFractionDigits: 5 })} 0G</strong><p>Visible only because this wallet created agents.</p></div> : null}
      </section>
      <section className="portfolio-refresh-bar">
        <div>
          <strong>{lastUpdated ? `Last updated ${lastUpdated}` : "Waiting for first wallet snapshot"}</strong>
          <span>{portfolioError || "Wallet positions and creator balances are read directly from 0G Chain."}</span>
        </div>
        <button className="secondary-button" disabled={!!busy || !address} onClick={() => refreshPortfolio(true)}>
          {busy === "refresh" ? "Refreshing..." : "Refresh portfolio"}
        </button>
      </section>

      {createdAgents.length ? <section className="creator-console-grid">
        <div className="glass-card creator-console-main">
          <div className="section-heading-row">
            <div>
              <span className="section-kicker">Creator console</span>
              <h2>Agents launched</h2>
            </div>
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
                  <p className="private-revenue-copy">Private revenue: {claimableByAgent[agent.id] ?? "0.0"} 0G</p>
                  <div className="managed-actions">
                    <Link className="proof-link" href={`/agents/${agent.id}`}>Manage</Link>
                    <Link className="primary-button" href={`/agents/${agent.id}#creator-console`}>Activate compute</Link>
                    <button className="secondary-button" disabled={!!busy} onClick={() => setActive(agent.id, !agent.active)}>
                      {busy === `active-${agent.id}` ? "Updating..." : agent.active ? "Pause" : "Activate"}
                    </button>
                    <button className="secondary-button" disabled={!!busy || !Number(claimableByAgent[agent.id])} onClick={() => claimRevenue(agent.id)}>
                      {busy === `claim-${agent.id}` ? "Claiming..." : "Claim revenue"}
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
            <li>Claim creator earnings when task/key activity accrues</li>
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
      </section> : address ? (
        <section className="glass-card user-portfolio-empty">
          <span className="section-kicker">User portfolio</span>
          <h2>No creator controls for this wallet</h2>
          <p>Your key positions remain visible below. Creator revenue and management controls only appear for wallets that launched agents.</p>
        </section>
      ) : null}
      {status ? <p className="status-line portfolio-status">{status}</p> : null}
    </>
  );
}
