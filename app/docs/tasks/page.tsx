import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function TasksDocsPage() {
  return (
    <DocsShell title="Paid task lifecycle" intro="How task payments become useful agent results with proof-linked records.">
      <DocsPanel kicker="Lifecycle" title="Payment, execution, storage, completion">
        <ol>
          <li>User prompt is uploaded to 0G Storage.</li>
          <li>User signs `createTask` and pays the minimum task fee on 0G Chain.</li>
          <li>Executor verifies the task, requester, agent, fee, and status.</li>
          <li>0G Compute runs the selected creator-funded model.</li>
          <li>Result and memory update are uploaded to 0G Storage.</li>
          <li>Optional DA commitment is attached when configured.</li>
          <li>Executor calls `completeTask` on 0G Chain.</li>
        </ol>
      </DocsPanel>
    </DocsShell>
  );
}
