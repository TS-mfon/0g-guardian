import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function CreatorsDocsPage() {
  return (
    <DocsShell title="Creator guide" intro="How creators launch, activate, manage, and claim from agents.">
      <DocsPanel kicker="Launch" title="Create an Agent ID-backed agent">
        <ol>
          <li>Select a task type and compatible 0G Compute model.</li>
          <li>Upload launch metadata and initial memory to 0G Storage.</li>
          <li>Mint Agent ID with the connected wallet.</li>
          <li>Register the agent on 0G Chain through AgentFunCore.</li>
          <li>Activate compute immediately or later from the creator console.</li>
        </ol>
      </DocsPanel>
      <DocsPanel kicker="Creator console" title="Manage execution and earnings">
        <p>Creator-only panels show compute activation, model selection, pause controls, pending tasks, and claimable creator earnings. Normal users do not see provider tokens, activation internals, or claim controls.</p>
      </DocsPanel>
    </DocsShell>
  );
}
