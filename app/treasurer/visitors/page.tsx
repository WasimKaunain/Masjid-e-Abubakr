import { redirect } from "next/navigation";
import Link from "next/link";
import { getTreasurerSession } from "@/lib/auth";
import VisitorBadge from "@/components/visitor-badge";
import VisitorsTable from "@/components/visitors-table";

type Props = {
  searchParams?: Promise<{ location?: string; from?: string; to?: string }>;
};

export default async function VisitorsPage({ searchParams }: Props) {
  if (!(await getTreasurerSession())) redirect("/treasurer/login");

  const params = (await searchParams) ?? {};

  return (
    <main className="utility-shell">
      <section className="utility-card wide-card">
        <div className="treasurer-top-actions">
          <Link className="pill-link" href="/treasurer">
            ← Back
          </Link>
          <VisitorBadge compact />
        </div>

        <p className="eyebrow">Treasurer</p>
        <h1>Visitors</h1>

        <VisitorsTable initialFilters={params} />
      </section>
    </main>
  );
}
