import { useEffect, useMemo, useState } from "react";
import { getBooks } from "../api/bookApi";
import { getMembers } from "../api/memberApi";
import { getIssues, issueBook, checkAvailability } from "../api/issueApi";
import { memberCode, apiError, fmt, issueStatus } from "../api/helpers";
import SearchSelect from "../components/SearchSelect";

const MAX_LOANS = 3; // keep in sync with MaxBooksPerMember in IssueController

const addDays = (n) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toLocaleDateString("en-CA"); // YYYY-MM-DD in local time
};

export default function IssueBooks() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [form, setForm] = useState({ memberId: "", bookId: "", dueDate: addDays(14) });
  const [avail, setAvail] = useState(null);
  const [filter, setFilter] = useState("All");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const load = async () => {
    try {
      const [b, m, i] = await Promise.all([getBooks(), getMembers(), getIssues()]);
      setBooks(b.data);
      setMembers(m.data);
      setIssues(i.data);
    } catch (e) {
      setError("Could not load data: " + apiError(e));
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 3000); };

  const onBookChange = async (bookId) => {
    setForm((f) => ({ ...f, bookId }));
    setAvail(null);
    setError("");
    if (!bookId) return;
    try {
      const r = await checkAvailability(bookId);
      setAvail(r.data);
    } catch (e) {
      setError(apiError(e));
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await issueBook({
        memberId: Number(form.memberId),
        bookId: Number(form.bookId),
        dueDate: form.dueDate,
      });
      flash("Book issued successfully");
      setForm({ memberId: "", bookId: "", dueDate: addDays(14) });
      setAvail(null);
      load();
    } catch (err) {
      setError(apiError(err));
    }
  };

  // books this member currently holds (used for the info line + validation)
  const activeLoans = useMemo(
    () => issues.filter((i) => !i.returnDate),
    [issues]
  );
  const memberLoans = useMemo(
    () => (form.memberId ? activeLoans.filter((i) => i.memberId === Number(form.memberId)) : []),
    [activeLoans, form.memberId]
  );
  const alreadyHas = memberLoans.some((i) => i.bookId === Number(form.bookId));
  const atLimit = memberLoans.length >= MAX_LOANS;

  const canIssue =
    form.memberId && form.bookId && avail && avail.available > 0 && !atLimit && !alreadyHas;

  const rows = issues.filter((i) => filter === "All" || issueStatus(i) === filter);

  return (
    <>
      <h2 className="page-title">Issue Books</h2>
      {error && <div className="alert">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <section className="card" style={{ marginBottom: 20 }}>
        <div className="card-head"><h3>New Issue</h3></div>
        <form className="issue-form" onSubmit={submit}>
          <div className="field">
            <span className="field-label">Member</span>
            <SearchSelect
              items={members}
              value={form.memberId}
              onChange={(id) => setForm({ ...form, memberId: id })}
              placeholder="Search by name, NIC, phone or member ID (e.g. M0012)"
              getLabel={(m) => `${memberCode(m.id)} – ${m.name}`}
              getSearch={(m) => `${memberCode(m.id)} ${m.name} ${m.nic} ${m.phone ?? ""}`}
              renderItem={(m) => (
                <>
                  <div className="ss-main">{m.name}</div>
                  <div className="ss-sub">{memberCode(m.id)} · {m.nic}{m.phone ? ` · ${m.phone}` : ""}</div>
                </>
              )}
            />
            {form.memberId && (
              <div className={`pick-info ${atLimit ? "bad" : ""}`}>
                {atLimit
                  ? `Borrowing limit reached (${memberLoans.length}/${MAX_LOANS})`
                  : `Currently borrowing ${memberLoans.length} of ${MAX_LOANS} books`}
                {memberLoans.length > 0 && (
                  <ul>
                    {memberLoans.map((l) => (
                      <li key={l.id}>{l.bookTitle} – due {fmt(l.dueDate)}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <div className="field">
            <span className="field-label">Book</span>
            <SearchSelect
              items={books}
              value={form.bookId}
              onChange={onBookChange}
              placeholder="Search by title, author or year"
              getLabel={(b) => `${b.title} – ${b.author}`}
              getSearch={(b) => `${b.title} ${b.author} ${b.publisher ?? ""} ${b.year}`}
              isDisabled={(b) => b.available <= 0}
              renderItem={(b) => (
                <div className="ss-row">
                  <div>
                    <div className="ss-main">{b.title}</div>
                    <div className="ss-sub">{b.author} · {b.year}</div>
                  </div>
                  <span className={`badge ${b.available > 0 ? "ok" : "danger"}`}>
                    {b.available > 0 ? `${b.available} available` : "unavailable"}
                  </span>
                </div>
              )}
            />
            {avail && (
              <div className={`pick-info ${avail.available > 0 ? "" : "bad"}`}>
                {avail.available > 0
                  ? `✔ ${avail.available} of ${avail.total} copies available`
                  : "✘ No copies available. This book cannot be issued."}
              </div>
            )}
            {alreadyHas && <div className="pick-info bad">This member already has this book.</div>}
          </div>

          <label className="field">
            <span className="field-label">Issue Date</span>
            <input value={new Date().toLocaleDateString()} disabled />
          </label>

          <label className="field">
            <span className="field-label">Return Date</span>
            <input type="date" min={addDays(1)} value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })} required />
            <span className="quick-dates">
              {[7, 14, 21].map((n) => (
                <button key={n} type="button" className="chip" onClick={() => setForm({ ...form, dueDate: addDays(n) })}>
                  {n} days
                </button>
              ))}
            </span>
          </label>

          <div className="full">
            <button className="btn primary" disabled={!canIssue}>Issue Book</button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Issue Records</h3>
          <div className="tabs">
            {["All", "Issued", "Overdue", "Returned"].map((t) => (
              <button key={t} className={filter === t ? "tab active" : "tab"} onClick={() => setFilter(t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th><th>Member</th><th>Book</th><th>Issued</th>
                <th>Due</th><th>Returned</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((i) => {
                const s = issueStatus(i);
                return (
                  <tr key={i.id}>
                    <td>{i.id}</td>
                    <td>{memberCode(i.memberId)} – {i.memberName}</td>
                    <td>{i.bookTitle}</td>
                    <td>{fmt(i.issueDate)}</td>
                    <td>{fmt(i.dueDate)}</td>
                    <td>{fmt(i.returnDate)}</td>
                    <td>
                      <span className={`badge ${s === "Overdue" ? "danger" : s === "Returned" ? "ok" : "info"}`}>{s}</span>
                    </td>
                  </tr>
                );
              })}
              {rows.length === 0 && <tr><td colSpan="7" className="empty">No records</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}