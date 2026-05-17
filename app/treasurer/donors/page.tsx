import { redirect } from "next/navigation";
import Link from "next/link";
import { getTreasurerSession } from "@/lib/auth";
import { getDonors } from "@/lib/treasurer-data";
import ManageDonorForm from "@/components/manage-donor-form";

export default async function ManageDonorsPage() {
  if (!(await getTreasurerSession())) redirect("/treasurer/login");
  const donors = await getDonors();

  return (
    <main className="utility-shell">
      <section className="utility-card narrow-card">
        <Link className="back-button" href="/treasurer">
          ← Back
        </Link>

        <p className="eyebrow">Treasurer</p>
        <h1>Add / remove donor</h1>
        <ManageDonorForm donors={donors} />
      </section>
    </main>
  );
}
