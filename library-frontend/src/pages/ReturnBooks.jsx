import { useEffect, useState } from "react";
import { getActiveLoans, calculateFine, returnBook } from "../api/issueApi";
import { apiError, fmt, memberCode, money } from "../api/helpers";

export default function ReturnBooks() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [confirm, setConfirm] = useState(null); // { loan, fine }
  const [saving, setSaving] = useState(false);

  const load = () =>
    getActiveLoans()
      .then((r) => setLoans(r.data))
      .catch((e) => setError(apiError(e)))
      .finally(() => setLoading(false));

  useEffect(() => { load(); }, []);

  const q = search.trim().toLowerCase();
  const shown = loans.filter(
    (l) =>
      !q ||
      l.bookTitle.toLowerCase().includes(q) ||
      l.memberName.toLowerCase().includes(q) ||
      (l.nic || "").toLowerCase().includes(q) ||
      memberCode(l.memberId).toLowerCase().includes(q)
  );

  const start = async (loan) => {
    setError(""); setSuccess("");
    try {
      const r = await calculateFine(loan.id);
      setConfirm({ loan, fine: r.data });
    } catch (e) {
      setError(apiError(e));
    }
  };

  const doReturn = async () => {
    setSaving(true);
    try {
      const r = await returnBook(confirm.loan.id);
      const { fine, daysOverdue } = r.data;
      setSuccess(
        `"${confirm.loan.bookTitle}" returned.` +
          (fine > 0 ? ` Fine: ${money(fine)} (${daysOverdue} days late).` : " No fine.")
      );
      setConfirm(null);
      await load();
    } catch (e) {
      setError(apiError(e));
      setConfirm(null);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h2 className="page-title">Return Books</h2>
      {error && <div className="alert">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      <section className="card">
        <div className="card-head">
          <h3>Borrowed Books ({loans.length})</h3>
          <input
            placeholder="Search by book, member name, NIC or ID"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ minWidth: 260 }}
          />
        </div>
        <table>
          <thead>
            <tr>
              <th>Book</th><th>Member</th><th>Issued</th><th>Due</th>
              <th>Status</th><th>Fine so far</th><th></th>
            </tr>
          </thead>
          <tbody>
            {shown.map((l) => (
              <tr key={l.id}>
                <td>{l.bookTitle}</td>
                <td>{memberCode(l.memberId)} – {l.memberName}</td>
                <td>{fmt(l.issueDate)}</td>
                <td>{fmt(l.dueDate)}</td>
                <td>
                  {l.daysOverdue > 0
                    ? <span className="badge danger">Overdue {l.daysOverdue}d</span>
                    : <span className="badge info">On time</span>}
                </td>
                <td>{money(l.fine)}</td>
                <td><button className="btn primary" onClick={() => start(l)}>Return</button></td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr><td colSpan="7" className="empty">No borrowed books found</td></tr>
            )}
          </tbody>
        </table>
      </section>

      {confirm && (
        <div className="overlay" onClick={() => setConfirm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Return</h3>
            <p><b>{confirm.loan.bookTitle}</b><br />
              Member: {memberCode(confirm.loan.memberId)} – {confirm.loan.memberName}</p>
            <p>Due date: {fmt(confirm.loan.dueDate)}<br />
              Return date: {fmt(new Date())}</p>
            {confirm.fine.daysOverdue > 0 ? (
              <div className="alert">
                {confirm.fine.daysOverdue} day(s) overdue × {money(confirm.fine.finePerDay)} ={" "}
                <b>{money(confirm.fine.fine)}</b> fine
              </div>
            ) : (
              <p>Returned on time – no fine.</p>
            )}
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirm(null)}>Cancel</button>
              <button className="btn primary" disabled={saving} onClick={doReturn}>
                {saving ? "Saving..." : "Confirm Return"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}