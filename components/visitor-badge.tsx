import Link from "next/link";
import { Eye, ArrowUpRight } from "lucide-react";
import { getVisitorCount } from "@/lib/visitor-data";

export default async function VisitorBadge({ compact }: { compact?: boolean }) {
  const count = await getVisitorCount();

  const className = compact
    ? "visitor-badge visitor-badge--compact"
    : "visitor-badge";

  return (
    <Link
      href="/treasurer/visitors"
      className={className}
      aria-label={`Visitors: ${count}`}
    >
      <div className="visitor-badge__glow" />

      <div className="visitor-badge__top">
        <div className="visitor-badge__icon">
          <Eye size={18} />
        </div>

        <ArrowUpRight size={16} className="visitor-badge__arrow" />
      </div>

      <div className="visitor-badge__content">
        <span className="visitor-badge__value">{count}</span>

        <span className="visitor-badge__label">
          Total Visitors
        </span>
      </div>
    </Link>
  );
}