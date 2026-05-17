import { redirect } from "next/navigation";
import { getTreasurerSession } from "@/lib/auth";
import {
  getTransactionsForMonth,
  getTreasurerMonthOptions,
} from "@/lib/treasurer-data";
import { monthKey, parseMonthKey } from "@/lib/months";
import DeleteTransactionsForm from "@/components/delete-transactions-form";

type Props = {
  searchParams?: Promise<{ month?: string }>;
};

export default async function DeleteTransactionsPage({ searchParams }: Props) {
  if (!(await getTreasurerSession())) redirect("/treasurer/login");
  const months = await getTreasurerMonthOptions();
  const params = await searchParams;
  const selectedMonth =
    params?.month && parseMonthKey(params.month) ? params.month : monthKey(months[0]);
  const transactions = await getTransactionsForMonth(selectedMonth);

  return (
    <main className="utility-shell">
      <section className="utility-card wide-card">
        <p className="eyebrow">Treasurer</p>
        <h1>Delete transactions</h1>
        <DeleteTransactionsForm
          months={months}
          selectedMonth={selectedMonth}
          transactions={transactions}
        />
      </section>
    </main>
  );
}
