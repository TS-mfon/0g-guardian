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
        <p>Production task execution requires executor credentials, selected-network 0G Storage configuration, a funded mainnet Router key, and a funded Galileo direct-provider key when testnet execution is enabled.</p>
      </DocsPanel>
    </DocsShell>
  );
}
