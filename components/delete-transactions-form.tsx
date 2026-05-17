"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { monthKey, monthLabel } from "@/lib/months";

type Transaction = {
  id: number;
  Name: string | null;
  Amount: number;
  Type: "Credit" | "Debit" | null;
};

export default function DeleteTransactionsForm({
  months,
  selectedMonth,
  transactions,
}: {
  months: Date[];
  selectedMonth: string;
  transactions: Transaction[];
}) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  function toggle(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/treasurer/delete-transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Transactions deleted." : data.message);
    if (response.ok) {
      setSelectedIds([]);
      router.refresh();
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        <span>Month</span>
        <select
          value={selectedMonth}
          onChange={(event) =>
            router.push(`/treasurer/delete-transactions?month=${event.target.value}`)
          }
        >
          {months.map((item) => (
            <option key={monthKey(item)} value={monthKey(item)}>
              {monthLabel(item)}
            </option>
          ))}
        </select>
      </label>

      <div className="table-shell table-shell--selectable">
        <table className="select-table" aria-label="Transactions">
          <thead>
            <tr>
              <th>Name</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => {
              const isSelected = selectedSet.has(transaction.id);
              return (
                <tr
                  key={transaction.id}
                  className={isSelected ? "row-selected" : ""}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => toggle(transaction.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(transaction.id);
                    }
                  }}
                >
                  <td>{transaction.Name ?? "—"}</td>
                  <td className="amount">₹{transaction.Amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {message && <p className="form-message">{message}</p>}
      <button className="primary-button">Delete selected</button>
    </form>
  );
}
