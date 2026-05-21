"use client";

import { useEffect, useMemo, useState } from "react";
import { RefreshCw, CalendarDays, CalendarRange } from "lucide-react";

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

      <div
        className="utility-row visitors-top-card"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <p className="subtle" style={{ margin: 0 }}>
            Total unique visitors
          </p>

          <h2 style={{ margin: "4px 0 0 0" }}>{count}</h2>
        </div>

        <button
          className="icon-button"
          type="button"
          onClick={load}
          disabled={loading}
          aria-label="Refresh"
        >
          <RefreshCw size={18} className={loading ? "spin-icon" : ""} />
        </button>
      </div>

      <div className="visitors-filter-card">
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

          <label className="date-icon-field">
            <span>From</span>

            <div className="date-icon-wrapper">
              <CalendarDays size={18} />

              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
          </label>

          <label className="date-icon-field">
            <span>To</span>

            <div className="date-icon-wrapper">
              <CalendarRange size={18} />

              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
          </label>

        </div>
      </div>

      {message && <p className="form-message">{message}</p>}

      <div className="table-shell visitors-table-card">
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