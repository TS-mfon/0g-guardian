import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export default function ForUsersPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">For users</span>
        <h1>A safer wallet moment without needing to read calldata.</h1>
        <p>
          0G Guardian turns confusing transaction prompts into specific warnings, recommended actions,
          and proof links that can be checked later.
        </p>
      </section>
      <section className="story-grid">
        {[
          ["Pick a guardian", "Choose a specialized agent for approvals, swaps, SocialFi permissions, or treasury actions."],
          ["Review before signing", "Paste or import the transaction intent and get a risk score with a plain-language explanation."],
          ["Keep proof", "Store the report on 0G Storage and anchor a receipt so the review can be audited later."]
        ].map(([title, body]) => (
          <article className="story-card" key={title}>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
      <div className="center-action"><Link className="primary-button" href="/review">Try the review page</Link></div>
    </main>
  );
}
