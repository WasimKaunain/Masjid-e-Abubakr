"use client";

import { useState } from "react";

type Donor = {
  id: number;
  name: string;
};

export default function ManageDonorForm({ donors }: { donors: Donor[] }) {
  const [action, setAction] = useState<"add" | "remove">("add");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setMessage("");

    try {
      const response = await fetch("/api/treasurer/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          name,
          amount: action === "add" ? Number(amount) : undefined,
          phone: action === "add" ? phone : undefined,
        }),
      });
      const data = await response.json();
      setMessage(response.ok ? "Donor list updated." : data.message);
      if (response.ok) {
        setName("");
        setAmount("");
        setPhone("");
        setSuccessOpen(true);
      }
    } catch {
      setMessage("Unable to update donor list");
    } finally {
      setSubmitting(false);
    }
  }

  const successTitle = action === "add" ? "Donor added" : "Donor removed";
  const successNote =
    action === "add"
      ? "Donor has been added successfully."
      : "Donor has been removed successfully.";

  return (
    <>
      <form className="form-stack" onSubmit={submit}>
        <label>
          <span>Action</span>
          <select
            value={action}
            onChange={(event) => setAction(event.target.value as "add" | "remove")}
          >
            <option value="add">Add</option>
            <option value="remove">Remove</option>
          </select>
        </label>
        {action === "add" ? (
          <label>
            <span>Name</span>
            <input value={name} onChange={(event) => setName(event.target.value)} />
          </label>
        ) : (
          <label>
            <span>Name</span>
            <select value={name} onChange={(event) => setName(event.target.value)}>
              <option value="">Choose donor</option>
              {donors.map((donor) => (
                <option key={donor.id} value={donor.name}>
                  {donor.name}
                </option>
              ))}
            </select>
          </label>
        )}
        {action === "add" && (
          <>
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
              <span>Phone number</span>
              <input value={phone} onChange={(event) => setPhone(event.target.value)} />
            </label>
          </>
        )}
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
            <h2 className="modal-title">{successTitle}</h2>
            <p className="modal-note">{successNote}</p>
          </div>
        </div>
      ) : null}
    </>
  );
}
