"use client";

import { useEffect, useMemo, useState } from "react";

type Row = {
  id: number;
  location: string | null;
  frequency: number;
  lastSeen: string;
};

type Filters = {
  location?: string;
  from?: string;
  to?: string;
};

type ApiResponse = {
  count?: number;
  rows?: Row[];
  places?: string[];
  message?: string;
};

export default function VisitorsTable({ initialFilters }: { initialFilters: Filters }) {
  const [location, setLocation] = useState(initialFilters.location ?? "");
  const [from, setFrom] = useState(initialFilters.from ?? "");
  const [to, setTo] = useState(initialFilters.to ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [count, setCount] = useState<number>(0);
  const [rows, setRows] = useState<Row[]>([]);
  const [places, setPlaces] = useState<string[]>([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [location, from, to]);

  async function load() {
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch(`/api/treasurer/visitors${queryString ? `?${queryString}` : ""}`);
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setMessage(data.message ?? "Unable to load visitors");
        return;
      }
      setCount(data.count ?? 0);
      setRows(data.rows ?? []);
      setPlaces(data.places ?? []);
    } catch {
      setMessage("Unable to load visitors");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryString]);

  return (
    <div className="form-stack">
      <div className="form-grid">
        <label className="form-span-2">
          <span>Place</span>
          <select value={location} onChange={(e) => setLocation(e.target.value)}>
            <option value="">All places</option>
            {places.map((place) => (
              <option key={place} value={place}>
                {place}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>From</span>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label>
          <span>To</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </label>
      </div>

      <div
        className="utility-row"
        style={{ justifyContent: "space-between", gap: 12, alignItems: "center" }}
      >
        <p className="subtle" style={{ margin: 0 }}>
          Total unique visitors: <strong>{count}</strong>
        </p>
        <button className="primary-button" type="button" onClick={load} disabled={loading}>
          {loading ? "Loading…" : "Refresh"}
        </button>
      </div>

      {message && <p className="form-message">{message}</p>}

      <div className="table-shell">
        <table className="select-table" aria-label="Visitors">
          <thead>
            <tr>
              <th>Location</th>
              <th className="amount">Count</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>{row.location ?? "—"}</td>
                  <td className="amount">{row.frequency}</td>
                  <td>{new Date(row.lastSeen).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={3} className="subtle" style={{ textAlign: "center", padding: "16px" }}>
                  {loading ? "Loading…" : "No visitors found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
