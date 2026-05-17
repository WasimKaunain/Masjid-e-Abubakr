"use client";

import { useMemo, useState } from "react";
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

  const selectedSet = useMemo(() => new Set(selected), [selected]);

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

      <div className="table-shell table-shell--selectable">
        <table className="select-table" aria-label="Unpaid donors">
          <thead>
            <tr>
              <th>Name</th>
              <th className="amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {donors.map((donor) => {
              const isSelected = selectedSet.has(donor.id);
              return (
                <tr
                  key={donor.id}
                  className={isSelected ? "row-selected" : ""}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => toggle(donor.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggle(donor.id);
                    }
                  }}
                >
                  <td>{donor.name}</td>
                  <td className="amount">₹{donor.amount.toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {message && <p className="form-message">{message}</p>}
      <button className="primary-button">Submit selected donations</button>
    </form>
  );
}
