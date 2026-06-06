import Link from "next/link";
import { ReactNode } from "react";
import { SiteNav } from "@/components/SiteNav";

const docsLinks = [
  ["/docs", "Overview"],
  ["/docs/users", "Users"],
  ["/docs/creators", "Creators"],
  ["/docs/models", "Models"],
  ["/docs/tasks", "Tasks"],
  ["/docs/compare", "Compare"],
  ["/docs/architecture", "Architecture"],
  ["/docs/storage", "0G Storage"],
  ["/docs/compute", "0G Compute"],
  ["/docs/contracts", "Contracts"],
  ["/docs/errors", "Errors"],
  ["/docs/local-setup", "Local setup"]
];

export function DocsShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <main>
      <SiteNav />
      <section className="page-hero docs-hero">
        <span className="section-kicker">Documentation</span>
        <h1>{title}</h1>
        <p>{intro}</p>
      </section>
      <section className="docs-layout">
        <aside className="docs-sidebar">
          {docsLinks.map(([href, label]) => <Link href={href} key={href}>{label}</Link>)}
        </aside>
        <div className="docs-content">{children}</div>
      </section>
    </main>
  );
}

export function DocsPanel({ kicker, title, children }: { kicker: string; title: string; children: ReactNode }) {
  return (
    <section className="docs-panel">
      <span className="section-kicker">{kicker}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
