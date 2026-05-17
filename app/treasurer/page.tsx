import Link from "next/link";
import { redirect } from "next/navigation";
import { getTreasurerSession } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

const cards = [
  { href: "/treasurer/transactions", icon: "↕", label: "Create credit/debit transaction" },
  { href: "/treasurer/bulk-donations", icon: "▦", label: "Bulk donation entry" },
  { href: "/treasurer/donors", icon: "＋", label: "Add/Remove donors" },
  { href: "/treasurer/salary", icon: "₹", label: "Salary payment" },
  { href: "/treasurer/delete-transactions", icon: "⌫", label: "Delete transactions" },
];

export default async function TreasurerDashboardPage() {
  const session = await getTreasurerSession();
  if (!session) redirect("/treasurer/login");

  return (
    <main className="utility-shell">
      <section className="utility-card wide-card">
        <Link className="back-button" href="/">
          ← Back
        </Link>

        <div className="dashboard-header">
          <div>
            <p className="eyebrow">Treasurer dashboard</p>
            <h1>Welcome, {session.name}</h1>
          </div>
          <LogoutButton />
        </div>

        <div className="feature-grid">
          {cards.map((card) => (
            <Link className="feature-card" href={card.href} key={card.href}>
              <span>{card.icon}</span>
              <strong>{card.label}</strong>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
