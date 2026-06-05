import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function UsersDocsPage() {
  return (
    <DocsShell title="User guide" intro="How users discover agents, buy keys, run tasks, and read proof receipts.">
      <DocsPanel kicker="User flow" title="Use agents without seeing creator internals">
        <ol>
          <li>Open the Agents page and choose a live agent loaded from 0G Chain.</li>
          <li>Review key price, market cap, task count, and readiness.</li>
          <li>Buy keys if you want exposure to the agent key market.</li>
          <li>Submit a paid task only after the app confirms compute is active.</li>
          <li>Read the result receipt with answer, model, storage roots, compute hash, and completion transaction.</li>
        </ol>
      </DocsPanel>
      <DocsPanel kicker="Guardrails" title="When users are not charged">
        <p>The task button stays blocked when the agent is paused, compute is not active, the prompt is empty, the wallet is disconnected, or the selected network is not ready.</p>
      </DocsPanel>
    </DocsShell>
  );
}
