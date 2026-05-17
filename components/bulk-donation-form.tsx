"use client";

import { useState } from "react";
import { monthKey, monthLabel } from "@/lib/months";

type Donor = {
  id: number;
  name: string;
  amount: number;
};

export default function BulkDonationForm({
  months,
  donors,
}: {
  months: Date[];
  donors: Donor[];
}) {
  const [month, setMonth] = useState<string>(monthKey(months[0]));
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/treasurer/bulk-donations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month, donorIds: selected }),
    });
    const data = await response.json();
    setMessage(response.ok ? "Bulk donations saved." : data.message);
    if (response.ok) setSelected([]);
  }

  return (
    <form className="form-stack" onSubmit={submit}>
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
      <div className="table-shell">
        <table>
          <thead>
            <tr>
              <th>Select</th>
              <th>Name</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((donor) => (
              <tr key={donor.id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.includes(donor.id)}
                    onChange={() => toggle(donor.id)}
                  />
                </td>
                <td>{donor.name}</td>
                <td>₹{donor.amount.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {message && <p className="form-message">{message}</p>}
      <button className="primary-button">Submit selected donations</button>
    </form>
  );
}
