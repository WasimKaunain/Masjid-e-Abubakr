import { redirect } from "next/navigation";
import Link from "next/link";
import { getTreasurerSession } from "@/lib/auth";
import { getDonors, getTreasurerMonthOptions } from "@/lib/treasurer-data";
import TransactionForm from "@/components/transaction-form";

export default async function CreateTransactionPage() {
  if (!(await getTreasurerSession())) redirect("/treasurer/login");
  const [months, donors] = await Promise.all([getTreasurerMonthOptions(), getDonors()]);

  return (
    <main className="utility-shell">
      <section className="utility-card narrow-card">
        <Link className="pill-link" href="/treasurer"> ← Back </Link>

        <p className="eyebrow">Treasurer</p>
        <h1>Create transaction</h1>
        <TransactionForm months={months} donors={donors} />
      </section>
    </main>
  );
}
