import { SiteNav } from "@/components/SiteNav";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { WalletConnect } from "@/components/WalletConnect";
import { loadAgentsFromChain, loadTasksFromChain } from "@/lib/agentfun";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const [agents, tasks] = await Promise.all([loadAgentsFromChain(), loadTasksFromChain()]);
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Portfolio</span>
        <h1>Your agents, keys, tasks, and revenue.</h1>
        <p>
          Connect a wallet to use the on-chain contract actions: launch agents, buy keys,
          create paid tasks, and claim creator revenue.
        </p>
      </section>
      <WalletConnect />
      <PortfolioSummary initialAgents={agents} initialTasks={tasks} />
    </main>
  );
}
