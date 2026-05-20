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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const selectedTransactions = useMemo(
    () => transactions.filter((t) => selectedSet.has(t.id)),
    [transactions, selectedSet],
  );

  const totals = useMemo(() => {
    const count = selectedTransactions.length;
    const amount = selectedTransactions.reduce((sum, t) => sum + t.Amount, 0);
    return { count, amount };
  }, [selectedTransactions]);

  function toggle(id: number) {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    // Open preview first
    if (!reviewOpen) {
      if (selectedIds.length === 0) {
        setMessage("Please select at least one transaction.");
        return;
      }
      setMessage("");
      setReviewOpen(true);
      return;
    }

    // Confirm -> hit API
    if (confirming) return;
    setConfirming(true);
    setMessage("");

    const deletedCount = selectedIds.length;

    try {
      const response = await fetch("/api/treasurer/delete-transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      const data = await response.json();
      setMessage(response.ok ? "Transactions deleted." : data.message);
      if (response.ok) {
        setSuccessCount(deletedCount);
        setSuccessOpen(true);
        setSelectedIds([]);
        setReviewOpen(false);
        router.refresh();
      }
    } catch {
      setMessage("Unable to delete transactions");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
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

        {!reviewOpen ? (
          <>
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
            <button className="primary-button" type="submit">
              Review & Delete
            </button>
          </>
        ) : (
          <>
            <div className="table-shell">
              <table className="select-table" aria-label="Delete transactions review">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>{transaction.Name ?? "—"}</td>
                      <td className="amount">₹{transaction.Amount.toFixed(2)}</td>
                    </tr>
                  ))}
                  <tr className="row-selected">
                    <td>
                      <strong>Total ({totals.count})</strong>
                    </td>
                    <td className="amount">
                      <strong>₹{totals.amount.toFixed(2)}</strong>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {message && <p className="form-message">{message}</p>}

            <div
              className="form-actions"
              style={{ justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}
            >
              <button
                className="pill-button"
                type="button"
                style={{ flex: "1 1 140px" }}
                onClick={() => {
                  if (confirming) return;
                  setReviewOpen(false);
                }}
              >
                Cancel
              </button>
              <button
                className="primary-button"
                type="submit"
                disabled={confirming}
                style={{ flex: "1 1 140px" }}
              >
                {confirming ? "Deleting…" : "Confirm"}
              </button>
            </div>
          </>
        )}
      </form>

      {successOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card" style={{ width: "min(520px, 100%)" }}>
            <button
              className="modal-close"
              type="button"
              onClick={() => setSuccessOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2 className="modal-title">Transactions deleted</h2>
            <p className="modal-note">
              Total {successCount} transaction{successCount === 1 ? "" : "s"} deleted successfully.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
