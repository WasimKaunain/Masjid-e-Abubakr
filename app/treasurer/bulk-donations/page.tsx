import { redirect } from "next/navigation";
import { getTreasurerSession } from "@/lib/auth";
import { getTreasurerMonthOptions, getUnpaidDonors } from "@/lib/treasurer-data";
import BulkDonationForm from "@/components/bulk-donation-form";

export default async function BulkDonationPage() {
  if (!(await getTreasurerSession())) redirect("/treasurer/login");
  const [months, donors] = await Promise.all([
    getTreasurerMonthOptions(),
    getUnpaidDonors(),
  ]);

  return (
    <main className="utility-shell">
      <section className="utility-card wide-card">
        <p className="eyebrow">Treasurer</p>
        <h1>Bulk donation entry</h1>
        <BulkDonationForm months={months} donors={donors} />
      </section>
    </main>
  );
}
