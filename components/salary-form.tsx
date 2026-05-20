"use client";

import { useState } from "react";
import { monthKey, monthLabel } from "@/lib/months";

export default function SalaryForm({ months }: { months: Date[] }) {
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState<string>(monthKey(months[0]));
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/treasurer/salary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payerName, amount: Number(amount), month }),
      });
      const data = await response.json();
      setMessage(response.ok ? "Salary payment saved." : data.message);
      if (response.ok) {
        setPayerName("");
        setAmount("");
        setSuccessOpen(true);
      }
    } catch {
      setMessage("Unable to save salary payment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="form-stack" onSubmit={submit}>
        <label>
          <span>Payer name</span>
          <input value={payerName} onChange={(event) => setPayerName(event.target.value)} />
        </label>
        <label>
          <span>Amount</span>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
          />
        </label>
        <label>
          <span>Month</span>
          <select value={month} onChange={(event) => setMonth(event.target.value)}>
            {months.map((item) => (
              <option key={monthKey(item)} value={monthKey(item)}>
                {monthLabel(item)}
              </option>
            ))}
          </select>
        </label>
        {message && <p className="form-message">{message}</p>}
        <button className="primary-button" type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit"}
        </button>
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
            <h2 className="modal-title">Salary paid successfully</h2>
            <p className="modal-note">The salary payment has been recorded.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
