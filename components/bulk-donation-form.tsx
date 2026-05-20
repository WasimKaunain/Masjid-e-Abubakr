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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const selectedDonors = useMemo(
    () => donors.filter((donor) => selectedSet.has(donor.id)),
    [donors, selectedSet],
  );

  const totals = useMemo(() => {
    const count = selectedDonors.length;
    const amount = selectedDonors.reduce((sum, donor) => sum + donor.amount, 0);
    return { count, amount };
  }, [selectedDonors]);

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();

    // Open preview first
    if (!reviewOpen) {
      if (selected.length === 0) {
        setMessage("Please select at least one donor.");
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

    // Capture count here (selected will be cleared on success)
    const submittedCount = selected.length;

    try {
      const response = await fetch("/api/treasurer/bulk-donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, donorIds: selected }),
      });
      const data = await response.json();
      setMessage(response.ok ? "Bulk donations saved." : data.message);
      if (response.ok) {
        setSuccessCount(submittedCount);
        setSuccessOpen(true);
        setSelected([]);
        setReviewOpen(false);
      }
    } catch {
      setMessage("Unable to save bulk donations");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
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

        {!reviewOpen ? (
          <>
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
            <button className="primary-button" type="submit">
              Review & Submit
            </button>
          </>
        ) : (
          <>
            <div className="table-shell">
              <table className="select-table" aria-label="Bulk donation review">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th className="amount">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedDonors.map((donor) => (
                    <tr key={donor.id}>
                      <td>{donor.name}</td>
                      <td className="amount">₹{donor.amount.toFixed(2)}</td>
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
              style={{
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "wrap",
              }}
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
                {confirming ? "Confirming…" : "Confirm"}
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
            <h2 className="modal-title">Bulk donations saved</h2>
            <p className="modal-note">
              Total {successCount} transaction{successCount === 1 ? "" : "s"} added successfully.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
