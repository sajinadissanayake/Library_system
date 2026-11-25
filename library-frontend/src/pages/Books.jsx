import { useEffect, useMemo, useState } from "react";
import { getBooks, addBook, updateBook, deleteBook } from "../api/bookApi";
import BookModal from "../components/BookModal";

const PAGE_SIZE = 8;

export default function Books() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // null | {} (new) | book (edit)

  const load = async () => {
    try {
      const r = await getBooks();
      setBooks(r.data);
      setError("");
    } catch (e) {
      setError("Could not load books: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(""), 2500);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) =>
      [b.title, b.author, b.publisher, String(b.year)]
        .some((v) => v?.toLowerCase().includes(q))
    );
  }, [books, search]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const handleSave = async (data) => {
    try {
      if (data.id) {
        await updateBook(data.id, data);
        flash("Book updated");
      } else {
        await addBook(data);
        flash("Book added");
      }
      setModal(null);
      load();
    } catch (e) {
      setError("Save failed: " + (e.response?.data?.title || e.message));
    }
  };

  const handleDelete = async (b) => {
    if (!window.confirm(`Delete "${b.title}"?`)) return;
    try {
      await deleteBook(b.id);
      flash("Book deleted");
      load();
    } catch (e) {
      setError("Delete failed: " + e.message);
    }
  };

  const changeQty = async (b, delta) => {
    const qty = b.quantity + delta;
    if (qty < 0) return;
    try {
      await updateBook(b.id, { ...b, quantity: qty });
      setBooks((prev) => prev.map((x) => (x.id === b.id ? { ...x, quantity: qty } : x)));
    } catch (e) {
      setError("Quantity update failed: " + e.message);
    }
  };

  return (
    <>
      <div className="page-head">
        <h2 className="page-title">Book Management</h2>
        <button className="btn primary" onClick={() => setModal({})}>+ Add New Book</button>
      </div>

      {error && <div className="alert">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      <section className="card">
        <div className="toolbar">
          <input
            className="search"
            placeholder="Search by title, author, publisher or year..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
          <span className="muted">{filtered.length} book(s)</span>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Title</th><th>Author</th><th>Publisher</th>
                  <th>Year</th><th>Quantity</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => (
                  <tr key={b.id}>
                    <td>{b.id}</td>
                    <td><strong>{b.title}</strong></td>
                    <td>{b.author}</td>
                    <td>{b.publisher}</td>
                    <td>{b.year}</td>
                    <td>
                      <div className="qty">
                        <button onClick={() => changeQty(b, -1)}>−</button>
                        <span>{b.quantity}</span>
                        <button onClick={() => changeQty(b, 1)}>+</button>
                      </div>
                    </td>
                    <td>
                      {b.quantity === 0 ? <span className="badge danger">Out of stock</span>
                        : b.quantity <= 2 ? <span className="badge warn">Low</span>
                        : <span className="badge ok">Available</span>}
                    </td>
                    <td>
                      <button className="btn small" onClick={() => setModal(b)}>Edit</button>
                      <button className="btn small danger" onClick={() => handleDelete(b)}>Delete</button>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr><td colSpan="8" className="empty">No books found</td></tr>
                )}
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

      {modal && (
        <BookModal book={modal} onSave={handleSave} onClose={() => setModal(null)} />
      )}
    </>
  );
}