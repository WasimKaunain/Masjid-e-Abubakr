"use client";

import { useState } from "react";
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
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Name</th>
              <th>Amount</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(transaction.id)}
                    onChange={() => toggle(transaction.id)}
                  />
                </td>
                <td>{transaction.Name ?? "—"}</td>
                <td>₹{transaction.Amount.toFixed(2)}</td>
                <td>{transaction.Type ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className="form-message">{message}</p>}
      <button className="primary-button">Delete selected</button>
    </form>
  );
}
