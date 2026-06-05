import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function CompareDocsPage() {
  return (
    <DocsShell title="Compare lab" intro="Run the same paid task against two live agents and inspect both outputs side by side.">
      <DocsPanel kicker="Arena" title="Real execution before comparison">
        <p>The compare flow does not generate fake analysis. It creates and executes a paid task for each selected agent, then renders two result receipts so the user can compare answer quality, model, roots, hashes, and transactions.</p>
      </DocsPanel>
    </DocsShell>
  );
}
