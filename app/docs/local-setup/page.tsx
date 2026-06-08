import { DocsPanel, DocsShell } from "@/components/DocsShell";

export default function LocalSetupDocsPage() {
  return (
    <DocsShell title="Local setup" intro="Commands and environment notes for reviewers and contributors.">
      <DocsPanel kicker="Run" title="Install, test, and start">
        <pre>{`npm install
npm run test:contracts
npm run typecheck
npm run build
npm run dev`}</pre>
        <p>Production task execution requires executor credentials, 0G Storage configuration, and a funded 0G Router key on 0G Mainnet.</p>
      </DocsPanel>
    </DocsShell>
  );
}
