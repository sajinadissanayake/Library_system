import { useState } from "react";

export default function BookModal({ book, onSave, onClose }) {
  const isEdit = !!book.id;
  const [form, setForm] = useState({
    title: book.title ?? "",
    author: book.author ?? "",
    publisher: book.publisher ?? "",
    year: book.year ?? "",
    quantity: book.quantity ?? 1,
  });
  const [err, setErr] = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    const year = Number(form.year);
    const quantity = Number(form.quantity);
    if (year < 1000 || year > new Date().getFullYear()) return setErr("Enter a valid year.");
    if (quantity < 0) return setErr("Quantity cannot be negative.");
    onSave({ ...(isEdit ? { id: book.id } : {}), ...form, year, quantity });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{isEdit ? "Edit Book" : "Add New Book"}</h3>
        {err && <div className="alert">{err}</div>}

        <label>Title<input name="title" value={form.title} onChange={change} required /></label>
        <label>Author<input name="author" value={form.author} onChange={change} required /></label>
        <label>Publisher<input name="publisher" value={form.publisher} onChange={change} required /></label>
        <div className="row">
          <label>Year<input name="year" type="number" value={form.year} onChange={change} required /></label>
          <label>Quantity<input name="quantity" type="number" min="0" value={form.quantity} onChange={change} required /></label>
        </div>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{isEdit ? "Save Changes" : "Add Book"}</button>
        </div>
      </form>
    </div>
  );
}