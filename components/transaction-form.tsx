"use client";

import { useState } from "react";
import { monthKey, monthLabel } from "@/lib/months";

type Donor = {
  id: number;
  name: string;
  amount: number;
};

export default function TransactionForm({
  months,
  donors,
}: {
  months: Date[];
  donors: Donor[];
}) {
  const [month, setMonth] = useState<string>(monthKey(months[0]));
  const [type, setType] = useState<"Credit" | "Debit">("Credit");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  function selectDonor(value: string) {
    setName(value);
    const donor = donors.find((item) => item.name === value);
    if (donor) setAmount(String(donor.amount));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/treasurer/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          month,
          type,
          name: type === "Credit" ? name : undefined,
          amount: Number(amount),
          description: type === "Debit" ? description : undefined,
        }),
      });
      const data = await response.json();

      if (response.ok) {
        setMessage("");
        setSuccessOpen(true);
        setName("");
        setAmount("");
        setDescription("");
        return;
      }

      setMessage(data.message ?? "Unable to save transaction");
    } catch {
      setMessage("Unable to save transaction");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <form className="form-stack form-stack--polished" onSubmit={submit}>
        <div className="form-grid">
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

          <label>
            <span>Type</span>
            <select
              value={type}
              onChange={(event) => setType(event.target.value as "Credit" | "Debit")}
            >
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
            </select>
          </label>

          {type === "Credit" ? (
            <label className="form-span-2">
              <span>Donor name</span>
              <input
                list="donor-options"
                value={name}
                onChange={(event) => selectDonor(event.target.value)}
                placeholder="Search donor"
              />
              <datalist id="donor-options">
                {donors.map((donor) => (
                  <option key={donor.id} value={donor.name} />
                ))}
              </datalist>
            </label>
          ) : (
            <label className="form-span-2">
              <span>Description</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Expense description"
              />
            </label>
          )}

          <label>
            <span>Amount</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
            />
          </label>
        </div>

        {message && <p className="form-message">{message}</p>}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={submitting}>
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
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
            <h2 className="modal-title">Transaction saved</h2>
            <p className="modal-note">Your transaction has been recorded successfully.</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
