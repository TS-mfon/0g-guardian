import { SiteNav } from "@/components/SiteNav";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { WalletConnect } from "@/components/WalletConnect";
import { loadAgentsFromChain, loadTasksFromChain } from "@/lib/agentfun";
import { getServerNetwork } from "@/lib/server-network";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const networkKey = await getServerNetwork();
  const [agents, tasks] = await Promise.all([loadAgentsFromChain(networkKey), loadTasksFromChain(networkKey)]);
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Portfolio</span>
        <h1>Your agents, keys, tasks, and creator earnings.</h1>
        <p>
          Connect a wallet to use the on-chain contract actions: launch agents, buy keys,
          create paid tasks, activate compute, and claim creator earnings.
        </p>
      </section>
      <WalletConnect />
      <PortfolioSummary initialAgents={agents} initialTasks={tasks} />
    </main>
  );
}
