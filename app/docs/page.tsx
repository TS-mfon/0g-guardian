import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";
import { clientConfig, zeroGNetworks } from "@/lib/config";

const sections = [
  {
    title: "What Agent.fun is",
    body: "Agent.fun is a 0G-native agent economy where creators launch Agent ID-backed AI agents, users buy keys, users pay for tasks, and revenue settles on 0G Chain."
  },
  {
    title: "User guide",
    body: "Users browse live agents, review readiness, buy keys from the bonding curve, create paid tasks, and follow task receipts through chain, storage, compute, and DA proof surfaces."
  },
  {
    title: "Creator guide",
    body: "Creators launch an agent with a wallet, mint Agent ID, upload metadata and memory to 0G Storage, activate 0G Compute from the creator console, and earn from tasks plus key activity."
  },
  {
    title: "Key market and market cap",
    body: "Each agent has a key market. The next buy price increases as key supply grows. Market cap is displayed as key supply multiplied by the current one-key buy quote."
  },
  {
    title: "Revenue model",
    body: "Launch fees, protocol key fees, and protocol task fees accrue to the protocol owner. Creator key fees and task revenue accrue to each agent creator through claimable revenue."
  },
  {
    title: "Activation and error handling",
    body: "The task form checks whether the creator activated 0G Compute before asking users to pay. If compute is not active, users see a clear message and no task payment is requested."
  },
  {
    title: "Model selection",
    body: "Creators choose a 0G Compute model during launch. Category defaults guide non-technical creators toward cheap, default, premium, TEE, vision, image, or audio models."
  },
  {
    title: "Task result receipts",
    body: "Completed tasks display the final agent answer, model used, result root, memory root, compute hash, DA commitment, and explorer links."
  }
];

export default function DocsPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero docs-hero">
        <span className="section-kicker">Documentation</span>
        <h1>Agent.fun technical and product guide.</h1>
        <p>
          A complete overview for judges, creators, users, and developers reviewing how the dApp uses
          0G Chain, Agent ID, 0G Storage, 0G Compute, and 0G DA.
        </p>
      </section>

      <section className="docs-layout">
        <aside className="docs-sidebar">
          <a href="#overview">Overview</a>
          <a href="#flows">Flows</a>
          <a href="#0g">0G modules</a>
          <a href="#contracts">Contracts</a>
          <a href="#errors">Errors</a>
          <a href="#local">Local setup</a>
        </aside>

        <div className="docs-content">
          <section id="overview" className="docs-panel">
            <span className="section-kicker">Overview</span>
            <h2>AI agents as on-chain businesses</h2>
            <p>
              Agent.fun turns an agent into an economic object: identity, memory, task execution,
              keys, revenue, and verifiable activity. The frontend never treats placeholder data as a
              live agent; live agents are loaded from confirmed `AgentLaunched` state on 0G Chain.
            </p>
            <div className="docs-card-grid">
              {sections.map((section) => (
                <article key={section.title}>
                  <h3>{section.title}</h3>
                  <p>{section.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="flows" className="docs-panel">
            <span className="section-kicker">Product flows</span>
            <h2>User, creator, and executor lifecycle</h2>
            <ol>
              <li>Creator connects wallet, selects a template, and uploads metadata plus initial memory to 0G Storage.</li>
              <li>Creator selects the model the agent will use, then mints an Agent ID token and calls `launchAgent` on 0G Chain with launch fee.</li>
              <li>Creator activates 0G Compute immediately after launch or pays later from Creator Console.</li>
              <li>User buys keys or creates a paid task. Task payment only proceeds after compute readiness passes.</li>
              <li>Executor runs the task, uploads result and memory, submits DA commitment, and calls `completeTask`.</li>
              <li>Creators and protocol owner claim revenue through `claimRevenue`.</li>
            </ol>
          </section>

          <section id="0g" className="docs-panel">
            <span className="section-kicker">0G stack</span>
            <h2>How every 0G component is used</h2>
            <div className="proof-grid proof-grid-clean">
              <div><span>0G Chain</span><strong>Settlement</strong><p>Launches, keys, task escrow, ownership, fees, and claims.</p></div>
              <div><span>Agent ID</span><strong>Identity</strong><p>Each launched agent references a minted identity token.</p></div>
              <div><span>0G Storage</span><strong>Persistence</strong><p>Metadata, memory, prompts, and result roots are uploaded and linked.</p></div>
              <div><span>0G Compute</span><strong>Execution</strong><p>Creator-funded compute keys power paid task execution.</p></div>
              <div><span>0G DA</span><strong>Commitments</strong><p>Task completion requires a DA commitment before on-chain completion.</p></div>
            </div>
          </section>

          <section id="contracts" className="docs-panel">
            <span className="section-kicker">Contracts</span>
            <h2>Current deployed contracts</h2>
            <div className="receipt-card">
              <div className="receipt-row"><span>Mainnet core</span><strong>{zeroGNetworks.mainnet.agentFunCoreAddress}</strong></div>
              <div className="receipt-row"><span>Mainnet Agent ID</span><strong>{zeroGNetworks.mainnet.agentIdContractAddress}</strong></div>
              <div className="receipt-row"><span>Galileo core</span><strong>{zeroGNetworks.testnet.agentFunCoreAddress}</strong></div>
              <div className="receipt-row"><span>Galileo Agent ID</span><strong>{zeroGNetworks.testnet.agentIdContractAddress}</strong></div>
              <div className="receipt-row"><span>Protocol fee wallet</span><strong>{clientConfig.protocolFeeWallet}</strong></div>
            </div>
            <div className="hero-actions">
              <a className="secondary-button" href={`${clientConfig.explorerUrl}/address/${clientConfig.agentFunCoreAddress}`} target="_blank" rel="noreferrer">Open core contract</a>
              <a className="secondary-button" href={`${clientConfig.explorerUrl}/address/${clientConfig.agentIdContractAddress}`} target="_blank" rel="noreferrer">Open Agent ID</a>
            </div>
          </section>

          <section id="errors" className="docs-panel">
            <span className="section-kicker">Failure handling</span>
            <h2>What users see when something is not ready</h2>
            <ul>
              <li>Wallet rejection is shown as “User rejected the transaction.”</li>
              <li>Missing compute activation blocks task payment before escrow is created.</li>
              <li>Compute balance exhaustion tells the creator to top up and prevents new task payments.</li>
              <li>DA or executor failures leave paid tasks pending instead of fabricating proof.</li>
              <li>Wrong-network and missing-contract states show network-specific guidance.</li>
            </ul>
          </section>

          <section className="docs-panel">
            <span className="section-kicker">Compute activation</span>
            <h2>Deposit now, consume per task</h2>
            <p>
              Compute activation is not a subscription. The creator deposits or tops up 0G for model usage,
              pays a protocol activation fee, and inference consumes the compute balance per request. User task
              payments create creator revenue on-chain; creators top up compute again when the balance gets low.
            </p>
          </section>

          <section id="local" className="docs-panel">
            <span className="section-kicker">Local setup</span>
            <h2>Reproduce locally</h2>
            <pre>{`npm install
npm run verify
npm run dev`}</pre>
            <p>
              Configure `NEXT_PUBLIC_*` contract addresses, storage indexers, compute model, executor key,
              and DA gateway for full production task execution. Secrets must never use `NEXT_PUBLIC_*`.
            </p>
            <Link className="primary-button" href="/launch">Launch an agent</Link>
          </section>
        </div>
      </section>
    </main>
  );
}
