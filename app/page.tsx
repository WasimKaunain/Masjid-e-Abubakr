import Dashboard from "@/components/dashboard";
import {
  buildMonthOptions,
  getDonationProgress,
  getDashboardMonths,
  getMonthTransactions,
} from "@/lib/dashboard-data";
import { monthKey, parseMonthKey } from "@/lib/months";

type HomeProps = {
  searchParams?: Promise<{
    month?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function Home({ searchParams }: HomeProps) {
  const { currentMonth, storedMonths } = await getDashboardMonths();
  const params = await searchParams;
  const requestedMonth = parseMonthKey(params?.month);
  const selectedMonth = requestedMonth ?? currentMonth;
  const monthOptions = buildMonthOptions(currentMonth, storedMonths);
  const [{ transactions, summary }, donationProgress] = await Promise.all([
    getMonthTransactions(selectedMonth),
    getDonationProgress(currentMonth),
  ]);

  return (
    <Dashboard
      currentMonthKey={monthKey(currentMonth)}
      selectedMonthKey={monthKey(selectedMonth)}
      monthOptions={monthOptions.map((month) => monthKey(month))}
      transactions={transactions}
      summary={summary}
      donationProgress={donationProgress}
      upiId={process.env.UPI_ID ?? ""}
    />
  );
}
