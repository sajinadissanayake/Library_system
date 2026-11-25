import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getBooks } from "../api/bookApi";
import { getStats } from "../api/dashboardApi";

function Stat({ label, value, color, note }) {
  return (
    <div className={`stat ${color}`}>
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {note && <div className="stat-note">{note}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([getBooks(), getStats()])
      .then(([b, s]) => {
        setBooks(b.data);
        setStats(s.data);
      })
      .catch((e) => setError("Could not load data: " + e.message))
      .finally(() => setLoading(false));
  }, []);

  const outOfStock = books.filter((b) => b.available === 0).length;
  const lowStock = books.filter((b) => b.available > 0 && b.available <= 2);
  const recent = [...books].sort((a, b) => b.id - a.id).slice(0, 5);

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <h2 className="page-title">Dashboard</h2>
      {error && <div className="alert">{error}</div>}

      <div className="stats">
        <Stat label="Total Titles" value={stats?.totalTitles ?? 0} color="blue" />
        <Stat label="Total Copies" value={stats?.totalBooks ?? 0} color="green" />
        <Stat label="Available Books" value={stats?.availableBooks ?? 0} color="green" />
        <Stat label="Borrowed Books" value={stats?.borrowedBooks ?? 0} color="blue" />
        <Stat label="Overdue Books" value={stats?.overdueBooks ?? 0} color="red" />
        <Stat label="Total Members" value={stats?.totalMembers ?? 0} color="gray" />
        <Stat label="Out of Stock" value={outOfStock} color="red" />
        <Stat label="Low Stock (≤ 2)" value={lowStock.length} color="orange" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h3>Recently Added</h3>
            <Link to="/books">View all</Link>
          </div>
          <table>
            <thead>
              <tr><th>Title</th><th>Author</th><th>Available</th></tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td><td>{b.author}</td><td>{b.available} / {b.quantity}</td>
                </tr>
              ))}
              {recent.length === 0 && <tr><td colSpan="3" className="empty">No books yet</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="card">
          <div className="card-head"><h3>Low Stock Alert</h3></div>
          <table>
            <thead>
              <tr><th>Title</th><th>Available</th></tr>
            </thead>
            <tbody>
              {lowStock.map((b) => (
                <tr key={b.id}>
                  <td>{b.title}</td>
                  <td><span className="badge warn">{b.available}</span></td>
                </tr>
              ))}
              {lowStock.length === 0 && <tr><td colSpan="2" className="empty">All good</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}