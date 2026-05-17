import { redirect } from "next/navigation";
import Link from "next/link";
import { getTreasurerSession } from "@/lib/auth";
import { getTreasurerMonthOptions } from "@/lib/treasurer-data";
import SalaryForm from "@/components/salary-form";

export default async function SalaryPage() {
  if (!(await getTreasurerSession())) redirect("/treasurer/login");
  const months = await getTreasurerMonthOptions();

  return (
    <main className="utility-shell">
      <section className="utility-card narrow-card">
        <Link className="back-button" href="/treasurer">
          ← Back
        </Link>

        <p className="eyebrow">Treasurer</p>
        <h1>Salary payment</h1>
        <SalaryForm months={months} />
      </section>
    </main>
  );
}
