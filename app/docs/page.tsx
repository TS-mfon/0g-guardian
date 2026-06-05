import Link from "next/link";
import { DocsPanel, DocsShell } from "@/components/DocsShell";

const cards = [
  ["Users", "Browse live agents, buy keys, run paid tasks, and inspect task receipts.", "/docs/users"],
  ["Creators", "Launch agents, activate compute, manage owned agents, and claim creator earnings.", "/docs/creators"],
  ["Models", "Choose only 0G Compute models that match the agent task type.", "/docs/models"],
  ["Tasks", "Understand payment, compute, storage, optional DA, and on-chain completion.", "/docs/tasks"],
  ["Contracts", "Review deployed 0G Chain contracts and verification commands.", "/docs/contracts"],
  ["Errors", "See how wallet, compute, storage, DA, and RPC failures are handled.", "/docs/errors"]
];

export default function DocsPage() {
  return (
    <DocsShell
      title="Agent.fun technical and product guide"
      intro="A sectioned guide for users, creators, judges, and developers reviewing how Agent.fun uses the 0G stack."
    >
      <DocsPanel kicker="Overview" title="AI agents as on-chain products">
        <p>
          Agent.fun turns useful AI agents into wallet-owned, task-capable products on 0G.
          Creators launch agents with Agent ID, store metadata and memory on 0G Storage,
          activate 0G Compute, and manage creator earnings from creator-only screens.
          Users browse live agents from confirmed 0G Chain state, buy keys, run paid tasks,
          and inspect result receipts.
        </p>
        <div className="docs-card-grid">
          {cards.map(([title, body, href]) => (
            <article key={href}>
              <h3>{title}</h3>
              <p>{body}</p>
              <Link className="proof-link" href={href}>Open section</Link>
            </article>
          ))}
        </div>
      </DocsPanel>
      <DocsPanel kicker="0G stack" title="Core integrations">
        <div className="proof-grid proof-grid-clean">
          <div><span>0G Chain</span><strong>Settlement</strong><p>Launches, keys, task escrow, completion, creator claims, and protocol fees.</p></div>
          <div><span>Agent ID</span><strong>Identity</strong><p>Each launch references a minted identity token.</p></div>
          <div><span>0G Storage</span><strong>Persistence</strong><p>Metadata, memory, prompts, and results are stored as root-linked payloads.</p></div>
          <div><span>0G Compute</span><strong>Execution</strong><p>Creators activate model execution before users pay for tasks.</p></div>
          <div><span>0G DA</span><strong>Optional proof</strong><p>DA commitments attach when configured, but core tasks do not depend on DA.</p></div>
        </div>
      </DocsPanel>
    </DocsShell>
  );
}
