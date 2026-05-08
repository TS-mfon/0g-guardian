import { SiteNav } from "@/components/SiteNav";
import { ReviewConsole } from "@/components/ReviewConsole";

export default function ReviewPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Transaction review</span>
        <h1>One page, one job: review a transaction intent.</h1>
        <p>Select a test guardian, load its sample transaction, and run a risk review. Add a 0G Compute key for live inference.</p>
      </section>
      <ReviewConsole />
    </main>
  );
}
