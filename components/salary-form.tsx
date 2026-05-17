"use client";

import { useState } from "react";
import { monthKey, monthLabel } from "@/lib/months";

export default function SalaryForm({ months }: { months: Date[] }) {
  const [payerName, setPayerName] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState<string>(monthKey(months[0]));
  const [message, setMessage] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
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
    }
  }

  return (
    <form className="form-stack" onSubmit={submit}>
      <label>
        <span>Payer name</span>
        <input value={payerName} onChange={(event) => setPayerName(event.target.value)} />
      </label>
      <label>
        <span>Amount</span>
        <input type="number" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} />
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
      <button className="primary-button">Submit</button>
    </form>
  );
}
