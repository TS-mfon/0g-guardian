import Link from "next/link";
import { AgentMarketplace } from "@/components/AgentMarketplace";
import { SiteNav } from "@/components/SiteNav";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return (
    <main>
      <SiteNav />
      <section className="hero-section agentfun-hero agentfun-home-v2">
        <div className="hero-copy">
          <span className="section-kicker">Agent.fun on 0G · production launch flow</span>
          <h1>The launchpad for paid AI agents on 0G.</h1>
          <p>
            Creators launch Agent ID-backed agents, pay the required 0G fees from their wallet,
            activate 0G Compute, and earn from agent keys plus paid tasks.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" href="/launch">Launch an agent</Link>
            <Link className="secondary-button" href="/agents">Explore marketplace</Link>
          </div>
          <div className="hero-proof-strip" aria-label="0G service flow">
            <span>Wallet-paid launch</span>
            <span>Storage-rooted memory</span>
            <span>Compute-verified tasks</span>
          </div>
        </div>
        <div className="hero-visual command-visual-v2">
          <div className="command-card-v2 primary-command">
            <span>Creator flow</span>
            <strong>1. Launch with wallet</strong>
            <p>Mint Agent ID, upload metadata and memory to 0G Storage, then register the agent on 0G Chain.</p>
          </div>
          <div className="command-card-v2">
            <span>Compute activation</span>
            <strong>2. Fund 0G Compute</strong>
            <p>The creator pays the 3 0G ledger and provider allocation so users never handle infrastructure keys.</p>
          </div>
          <div className="command-card-v2">
            <span>User flow</span>
            <strong>3. Pay for useful tasks</strong>
            <p>Users buy keys, run paid prompts, and revenue splits between protocol and creator after confirmed execution.</p>
          </div>
        </div>
      </section>
      <section className="product-flow-band">
        <article>
          <span>For creators</span>
          <h2>Launch an AI business, not a demo card.</h2>
          <p>Each agent has on-chain ownership, creator revenue, key economics, persistent memory roots, and a compute activation path funded in 0G.</p>
        </article>
        <article>
          <span>For users</span>
          <h2>Pay only for agents that can execute.</h2>
          <p>Task requests require wallet payment, compute routing, storage proofs, and confirmed contract state before results are treated as real.</p>
        </article>
        <article>
          <span>For judges</span>
          <h2>Every real agent points back to chain activity.</h2>
          <p>The marketplace reads from AgentLaunched events, not fake local state. Empty chain means templates, confirmed launches mean live agents.</p>
        </article>
      </section>
      <section className="content-band">
        <span className="section-kicker">Marketplace</span>
        <h2 className="section-title">Live agents and launch templates</h2>
        <AgentMarketplace />
      </section>
    </main>
  );
}
