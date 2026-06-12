"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AgentView, TaskView } from "@/lib/agentfun";
import { useWallet } from "./WalletProvider";
import { agentFunCoreReadContract } from "@/lib/wallet";

export function UserPortfolioSummary({ agents, tasks }: { agents: AgentView[]; tasks: TaskView[] }) {
  const { address } = useWallet();
  const [positions, setPositions] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!address) return setPositions({});
    void agentFunCoreReadContract().then(async (contract) => {
      const entries = await Promise.all(agents.map(async (agent) => [agent.id, String(await contract.keyBalance(BigInt(agent.id), address))] as const));
      setPositions(Object.fromEntries(entries));
    }).catch(() => setPositions({}));
  }, [address, agents]);
  const held = agents.filter((agent) => Number(positions[agent.id] ?? 0) > 0);
  const submitted = address ? tasks.filter((task) => task.requester.toLowerCase() === address.toLowerCase()) : [];
  return (
    <>
      <section className="portfolio-grid">
        <div><span>Keys held</span><strong>{address ? held.length : "Connect"}</strong><p>Confirmed key positions for this wallet.</p></div>
        <div><span>Tasks submitted</span><strong>{address ? submitted.length : "Connect"}</strong><p>Paid task records persist on-chain.</p></div>
        <div><span>Refunded</span><strong>{address ? submitted.filter((task) => task.status === 4).length : "Connect"}</strong><p>Expired escrow recovered by this wallet.</p></div>
      </section>
      <section className="market-grid">
        {submitted.map((task) => <Link className="agent-tile" href={`/tasks/${task.id}`} key={task.id}><span>Task #{task.id}</span><h3>{["None", "Open", "Running", "Completed", "Refunded"][task.status]}</h3><p>Agent #{task.agentId} · {task.fee} 0G escrow remaining</p><strong>Open task receipt</strong></Link>)}
        {address && !submitted.length ? <div className="glass-card"><h2>No submitted tasks</h2><p>Your paid tasks, results, refunds, and ratings will appear here.</p></div> : null}
      </section>
    </>
  );
}
