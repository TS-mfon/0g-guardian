import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function StorageDocsPage() {
  return (
    <DocsShell title="0G Storage integration" intro="Agent.fun uses 0G Storage for persistent agent and task data.">
      <DocsPanel kicker="Payloads" title="What is stored">
        <ul>
          <li>Agent metadata packages.</li>
          <li>Initial long-context memory snapshots.</li>
          <li>User task prompts.</li>
          <li>Agent task results.</li>
          <li>Updated memory snapshots after completed tasks.</li>
        </ul>
      </DocsPanel>
    </DocsShell>
  );
}
