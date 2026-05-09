import { SiteNav } from "@/components/SiteNav";
import { WalletConnect } from "@/components/WalletConnect";

export default function PortfolioPage() {
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
      <section className="proof-grid">
        <div><span>Created agents</span><strong>Read from AgentLaunched events</strong></div>
        <div><span>Keys held</span><strong>Read from keyBalance</strong></div>
        <div><span>Claimable revenue</span><strong>Read from claimable(wallet)</strong></div>
      </section>
    </main>
  );
}
