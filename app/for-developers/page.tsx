import Link from "next/link";
import { SiteNav } from "@/components/SiteNav";

export default function ForDevelopersPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">For developers</span>
        <h1>Add verifiable AI guardrails to any dApp flow.</h1>
        <p>
          Developers can register guardian agents, call 0G Compute for reviews, persist full reports
          on 0G Storage, commit availability evidence through 0G DA, and anchor receipts on 0G Chain.
        </p>
      </section>
      <section className="developer-map">
        <article>
          <span>01</span>
          <h2>Register</h2>
          <p>Create an Agent ID-linked guardian with tags, policy, and an encrypted metadata root.</p>
        </article>
        <article>
          <span>02</span>
          <h2>Review</h2>
          <p>Send transaction intent to a specialized guard agent and validate structured 0G Compute JSON.</p>
        </article>
        <article>
          <span>03</span>
          <h2>Prove</h2>
          <p>Upload reports to 0G Storage, commit DA evidence, and write compact proof receipts on-chain.</p>
        </article>
      </section>
      <section className="code-panel">
        <pre>{`recordReview(
  agentTokenId,
  txIntentHash,
  reportRoot,
  daCommitment,
  computeHash,
  riskScore,
  verdict
)`}</pre>
      </section>
      <div className="center-action"><Link className="primary-button" href="/register">Register a guardian</Link></div>
    </main>
  );
}
