import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function DaDocsPage() {
  return (
    <DocsShell title="Optional 0G DA proof layer" intro="0G DA is useful for high-throughput commitments, but v1 Agent.fun tasks do not depend on DA to function.">
      <DocsPanel kicker="Strategy" title="Best-effort DA attachment">
        <p>If `OG_DA_GATEWAY_URL` is configured, task completion attempts to attach a DA commitment. If it is not configured or fails, the task can still complete with Storage roots, compute hash, and on-chain completion. The receipt shows “DA proof not attached.”</p>
      </DocsPanel>
    </DocsShell>
  );
}
