import { redirect } from "next/navigation";
import { getTreasurerSession } from "@/lib/auth";
import TreasurerLoginForm from "@/components/treasurer-login-form";

export default async function TreasurerLoginPage() {
  if (await getTreasurerSession()) {
    redirect("/treasurer");
  }

  return (
    <main className="utility-shell">
      <section className="utility-card narrow-card">
        <p className="eyebrow">Treasurer access</p>
        <h1>Verify your email</h1>
        <TreasurerLoginForm />
      </section>
    </main>
  );
}
