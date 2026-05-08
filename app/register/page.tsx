import { SiteNav } from "@/components/SiteNav";
import { RegisterGuardianForm } from "@/components/RegisterGuardianForm";

export default function RegisterPage() {
  return (
    <main>
      <SiteNav />
      <section className="page-hero">
        <span className="section-kicker">Register guardian</span>
        <h1>One page, one job: prepare a guardian agent profile.</h1>
        <p>Build the metadata payload that will be uploaded to 0G Storage and linked to Agent ID before chain registration.</p>
      </section>
      <RegisterGuardianForm />
    </main>
  );
}
