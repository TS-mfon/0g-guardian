import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function ErrorsDocsPage() {
  return (
    <DocsShell title="Error handling" intro="User-facing failures should be clear, short, and action-oriented.">
      <DocsPanel kicker="Handled states" title="No raw wallet or server dumps">
        <ul>
          <li>Rejected wallet transactions display “User rejected the transaction.”</li>
          <li>Missing compute activation blocks payment before escrow.</li>
          <li>Storage upload failures stop launch or task creation.</li>
          <li>Missing compute credentials never produce fake task output.</li>
          <li>Uncompleted tasks remain refundable after their deadline.</li>
          <li>Wrong-network states show the selected 0G network requirement.</li>
        </ul>
      </DocsPanel>
    </DocsShell>
  );
}
