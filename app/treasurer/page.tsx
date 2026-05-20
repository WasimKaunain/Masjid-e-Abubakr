
import { motion } from "framer-motion";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTreasurerSession } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";


const cards = [
	{
		href: "/treasurer/transactions",
		icon: "🧾",
		title: "Create Transaction",
		label: "Add credit or debit entry",
	},
	{
		href: "/treasurer/bulk-donations",
		icon: "📥",
		title: "Bulk Donations",
		label: "Upload / enter multiple donations",
	},
	{
		href: "/treasurer/donors",
		icon: "👥",
		title: "Manage Donors",
		label: "Add or remove monthly donors",
	},
	{
		href: "/treasurer/salary",
		icon: "💸",
		title: "Salary Payment",
		label: "Record salary debit for the month",
	},
	{
		href: "/treasurer/delete-transactions",
		icon: "🗑️",
		title: "Delete Transactions",
		label: "Remove incorrect / duplicate entries",
	},
];

export default async function TreasurerDashboardPage() {
	const session = await getTreasurerSession();
	if (!session) redirect("/treasurer/login");

	return (
		<main className="utility-shell">
			<section className="utility-card wide-card">
				<div className="treasurer-top-actions">
					<Link className="pill-link" href="/"> ← Back </Link>
					<LogoutButton />
				</div>

			
				<div className="dashboard-header treasurer-header">
				  <div className="treasurer-header-content">
				    <span className="welcome-text">Welcome</span>
					
				    <h1 className="treasurer-name">
				      {session.name}
				    </h1>
					
				    <p className="subtle treasurer-subtitle">
				      Choose a service to continue.
				    </p>
				  </div>
				</div>

				<div className="feature-stack">
					{cards.map((card) => (
						<Link
							className="glass-service-card"
							href={card.href}
							key={card.href}
						>
							<div
								className="glass-service-card__icon"
								aria-hidden="true"
							>
								{card.icon}
							</div>
							<div className="glass-service-card__body">
								<strong>{card.title}</strong>
								<span>{card.label}</span>
							</div>
						</Link>
					))}
				</div>
			</section>
		</main>
	);
}
