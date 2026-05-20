import Link from "next/link";
import { getVisitorCount } from "@/lib/visitor-data";

export default async function VisitorBadge({ compact }: { compact?: boolean }) {
  const count = await getVisitorCount();
  const className = compact ? "visitor-badge visitor-badge--compact" : "visitor-badge";

  return (
    <Link href="/treasurer/visitors" className={className} aria-label={`Visitors: ${count}`}>
      <span className="visitor-badge__value">{count}</span>
      <span className="visitor-badge__label">Total Visitors</span>
    </Link>
  );
}
