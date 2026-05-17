"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
  const [month, setMonth] = useState<string>(monthKey(months[0]));
  const [selected, setSelected] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const selectedDonors = useMemo(() => {
    const set = new Set(selected);
    return donors.filter((d) => set.has(d.id));
  }, [donors, selected]);

  const totals = useMemo(() => {
    const count = selectedDonors.length;
    const amount = selectedDonors.reduce((sum, d) => sum + d.amount, 0);
    return { count, amount };
  }, [selectedDonors]);

  function toggle(id: number) {
    setSelected((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  function openPreview(event: React.FormEvent) {
    event.preventDefault();
    setMessage("");
    if (selected.length === 0) {
      setMessage("Choose at least one donor.");
      return;
    }
    setPreviewOpen(true);
  }

  async function confirmSubmit() {
    if (confirming) return;

    try {
      setConfirming(true);
      const response = await fetch("/api/treasurer/bulk-donations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month, donorIds: selected }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message ?? "Unable to save bulk donations");
        setPreviewOpen(false);
        return;
      }

      // success
      setSelected([]);
      setPreviewOpen(false);
      router.push("/treasurer");
      router.refresh();
    } finally {
      setConfirming(false);
    }
  }

  return (
    <>
      <form className="form-stack form-stack--polished" onSubmit={openPreview}>
        <label>
          <span>Month</span>
          <select
            value={month}
            onChange={(event) => setMonth(event.target.value)}
            disabled={confirming}
          >
            {months.map((item) => (
              <option key={monthKey(item)} value={monthKey(item)}>
                {monthLabel(item)}
              </option>
            ))}
          </select>
        </label>

        <div className="bulk-list" role="list" aria-label="Unpaid donors">
          {donors.map((donor) => (
            <label key={donor.id} className="bulk-row" role="listitem">
              <input
                className="bulk-check"
                type="checkbox"
                checked={selected.includes(donor.id)}
                onChange={() => toggle(donor.id)}
                disabled={confirming}
              />
              <span className="bulk-name">{donor.name}</span>
              <span className="bulk-amount">₹{donor.amount.toFixed(2)}</span>
            </label>
          ))}
        </div>

        {message && <p className="form-message">{message}</p>}

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={confirming}>
            {confirming ? (
              <span className="button-spinner" aria-label="Submitting" />
            ) : null}
            Preview & Submit
          </button>
        </div>
      </form>

      {previewOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal-card bulk-preview">
            <button
              className="modal-close"
              type="button"
              onClick={() => setPreviewOpen(false)}
              aria-label="Close"
              disabled={confirming}
            >
              ×
            </button>

            <h2 className="modal-title">Confirm bulk donations</h2>
            <p className="modal-note">
              Please review the selected donors before confirming.
            </p>

            <div className="bulk-preview__list" aria-label="Selected donors">
              {selectedDonors.map((donor) => (
                <div className="bulk-preview__row" key={donor.id}>
                  <span className="bulk-preview__name">{donor.name}</span>
                  <span className="bulk-preview__amount">
                    ₹{donor.amount.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="bulk-preview__totals">
              <strong>Total persons:</strong> {totals.count}
              <span
                className="bulk-preview__totals-sep"
                aria-hidden="true"
              >
                ·
              </span>
              <strong>Total amount:</strong> ₹{totals.amount.toFixed(2)}
            </div>

            <div className="bulk-preview__actions">
              <button
                type="button"
                className="pill-button"
                onClick={() => setPreviewOpen(false)}
                disabled={confirming}
              >
                Cancel
              </button>
              <button
                type="button"
                className="pill-button pill-button--primary"
                onClick={confirmSubmit}
                disabled={confirming}
              >
                {confirming ? (
                  <span className="button-spinner" aria-label="Confirming" />
                ) : null}
                {confirming ? "Confirming..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
