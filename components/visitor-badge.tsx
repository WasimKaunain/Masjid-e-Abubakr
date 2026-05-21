import Link from "next/link";
import { Eye } from "lucide-react";
import { getVisitorCount } from "@/lib/visitor-data";

export default async function VisitorBadge({ compact }: { compact?: boolean }) {
  const count = await getVisitorCount();

  return (
    <Link
      href="/treasurer/visitors"
      className={`visitor-badge ${compact ? "visitor-badge--compact" : ""}`}
      aria-label={`Visitors: ${count}`}
    >
      <span className="visitor-badge__icon">
        <Eye size={14} />
      </span>

      <span className="visitor-badge__value">{count}</span>

      {!compact && (
        <span className="visitor-badge__label">
          Visitors
        </span>
      )}
    </Link>
  );
}