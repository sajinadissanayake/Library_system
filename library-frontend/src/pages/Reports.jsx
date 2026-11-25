import { useEffect, useMemo, useState } from "react";
import * as api from "../api/reportApi";
import { getMembers } from "../api/memberApi";
import { money,apiError, fmt, memberCode } from "../api/helpers";

 apiError, fmt, memberCode, money 
const badgeOf = (s) =>
  ({ Returned: "ok", Overdue: "danger", Issued: "info", "In Stock": "ok", "Low Stock": "warn", "Out of Stock": "danger" }[s] || "info");

const Status = (r) => <span className={`badge ${badgeOf(r.status)}`}>{r.status}</span>;

// v = plain value (used for search + CSV), render = optional JSX for the screen
const issueCols = (withMember = true) => [
  { h: "Book", v: (r) => r.bookTitle },
  ...(withMember ? [{ h: "Member", v: (r) => `${memberCode(r.memberId)} ${r.memberName}` }] : []),
  { h: "Issued", v: (r) => fmt(r.issueDate) },
  { h: "Due", v: (r) => fmt(r.dueDate) },
  { h: "Returned", v: (r) => fmt(r.returnDate) },
  { h: "Days Late", v: (r) => r.daysOverdue },
  { h: "Fine", v: (r) => Number(r.fine).toFixed(2), render: (r) => money(r.fine) },
  { h: "Status", v: (r) => r.status, render: Status },
];

const TABS = {
  history: { label: "Borrowing History", cols: issueCols(), hasDates: true },
  returned: { label: "Returned Books", cols: issueCols() },
  overdue: { label: "Overdue Books", cols: issueCols() },
  member: { label: "Member History", cols: issueCols(false), needsMember: true },
  inventory: {
    label: "Book Inventory",
    cols: [
      { h: "Title", v: (r) => r.title },
      { h: "Author", v: (r) => r.author },
      { h: "Publisher", v: (r) => r.publisher },
      { h: "Year", v: (r) => r.year },
      { h: "Total", v: (r) => r.quantity },
      { h: "Borrowed", v: (r) => r.borrowed },
      { h: "Available", v: (r) => r.available },
      { h: "Status", v: (r) => r.status, render: Status },
    ],
  },
};

const csvCell = (x) => `"${String(x ?? "").replace(/"/g, '""')}"`;

export default function Reports() {
  const [tab, setTab] = useState("history");
  const [rows, setRows] = useState([]);
  const [members, setMembers] = useState([]);
  const [memberId, setMemberId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const t = TABS[tab];

  useEffect(() => {
    getMembers().then((r) => setMembers(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (t.needsMember && !memberId) { setRows([]); return; }
    const calls = {
      history: () => api.getBorrowingHistory(from, to),
      returned: () => api.getReturnedBooks(),
      overdue: () => api.getOverdueBooks(),
      member: () => api.getMemberHistory(memberId),
      inventory: () => api.getBookInventory(),
    };
    setLoading(true); setError("");
    calls[tab]()
      .then((r) => setRows(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));
  }, [tab, memberId, from, to]); // eslint-disable-line

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => t.cols.map((c) => c.v(r)).join(" ").toLowerCase().includes(q));
  }, [rows, search, t]);

  const hasFine = t.cols.some((c) => c.h === "Fine");
  const totalFine = shown.reduce((s, r) => s + Number(r.fine || 0), 0);

  const exportCsv = () => {
    const lines = [t.cols.map((c) => csvCell(c.h)).join(",")];
    shown.forEach((r) => lines.push(t.cols.map((c) => csvCell(c.v(r))).join(",")));
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${tab}-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <>
      <h2 className="page-title">Reports</h2>

      <div className="tabs no-print">
        {Object.entries(TABS).map(([k, v]) => (
          <button key={k} className={`tab ${tab === k ? "active" : ""}`}
            onClick={() => { setTab(k); setSearch(""); }}>
            {v.label}
          </button>
        ))}
      </div>

      {error && <div className="alert">{error}</div>}

      <section className="card">
        <div className="card-head no-print" style={{ gap: 8, flexWrap: "wrap" }}>
          <h3>{t.label} ({shown.length})</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {t.needsMember && (
              <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
                <option value="">Select member...</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>{memberCode(m.id)} – {m.name}</option>
                ))}
              </select>
            )}
            {t.hasDates && (
              <>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Issued from" />
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="Issued to" />
              </>
            )}
            <input placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
            <button className="btn" onClick={exportCsv} disabled={!shown.length}>Export CSV</button>
            <button className="btn" onClick={() => window.print()}>Print</button>
          </div>
        </div>

        {loading ? <p>Loading...</p> : (
          <table>
            <thead>
              <tr>{t.cols.map((c) => <th key={c.h}>{c.h}</th>)}</tr>
            </thead>
            <tbody>
              {shown.map((r, i) => (
                <tr key={r.id ?? i}>
                  {t.cols.map((c) => <td key={c.h}>{c.render ? c.render(r) : c.v(r)}</td>)}
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={t.cols.length} className="empty">
                    {t.needsMember && !memberId ? "Select a member to see their history" : "No records found"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}

        {hasFine && shown.length > 0 && (
          <p style={{ textAlign: "right", marginTop: 12 }}>
            <b>Total fines: {money(totalFine)}</b>
          </p>
        )}
      </section>
    </>
  );
}