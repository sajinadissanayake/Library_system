import { useEffect, useMemo, useState } from "react";
import { getMembers, addMember, updateMember, deleteMember } from "../api/memberApi";
import { getIssues } from "../api/issueApi";
import { memberCode, apiError, fmt } from "../api/helpers";
import MemberModal from "../components/MemberModal";

const PAGE_SIZE = 8;

export default function Members() {
  const [members, setMembers] = useState([]);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null);

  const load = async () => {
    try {
      const [m, i] = await Promise.all([getMembers(), getIssues()]);
      setMembers(m.data);
      setIssues(i.data);
      setError("");
    } catch (e) {
      setError("Could not load members: " + apiError(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (t) => { setMsg(t); setTimeout(() => setMsg(""), 2500); };
  const borrowed = (id) => issues.filter((i) => i.memberId === id && !i.returnDate).length;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [memberCode(m.id), m.name, m.nic, m.phone, m.email].some((v) => v?.toLowerCase().includes(q))
    );
  }, [members, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const handleSave = async (data) => {
    try {
      if (data.id) { await updateMember(data.id, data); flash("Member updated"); }
      else { await addMember(data); flash("Member registered"); }
      setModal(null);
      setError("");
      load();
    } catch (e) {
      setError("Save failed: " + apiError(e));
      setModal(null);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete member "${m.name}"?`)) return;
    try {
      await deleteMember(m.id);
      flash("Member deleted");
      load();
    } catch (e) {
      setError("Delete failed: " + apiError(e));
    }
  };

  return (
    <>
      <div className="page-head">
        <h2 className="page-title">Member Management</h2>
        <button className="btn primary" onClick={() => setModal({})}>+ Register Member</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <section className="card">
        <div className="toolbar">
          <input
            className="search"
            placeholder="Search by member ID, name, NIC, phone or email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <span className="muted">{filtered.length} member(s)</span>
        </div>

        {loading ? <p>Loading...</p> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Member ID</th><th>Name</th><th>NIC</th><th>Phone</th>
                  <th>Email</th><th>Joined</th><th>Borrowed</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{memberCode(m.id)}</strong></td>
                    <td>{m.name}</td>
                    <td>{m.nic}</td>
                    <td>{m.phone || "–"}</td>
                    <td>{m.email || "–"}</td>
                    <td>{fmt(m.joinedDate)}</td>
                    <td><span className="badge info">{borrowed(m.id)}</span></td>
                    <td>
                      <button className="btn small" onClick={() => setModal(m)}>Edit</button>
                      <button className="btn small danger" onClick={() => handleDelete(m)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td colSpan="8" className="empty">No members found</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        <div className="pager">
          <button className="btn small" disabled={current === 1} onClick={() => setPage(current - 1)}>Prev</button>
          <span>Page {current} of {pages}</span>
          <button className="btn small" disabled={current === pages} onClick={() => setPage(current + 1)}>Next</button>
        </div>
      </section>

      {modal && <MemberModal member={modal} onSave={handleSave} onClose={() => setModal(null)} />}
    </>
  );
}