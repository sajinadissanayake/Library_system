import { useState, useEffect } from "react";

const empty = { title: "", author: "", publisher: "", year: "", quantity: "" };

export default function BookForm({ onSave, editingBook, onCancel }) {
  const [form, setForm] = useState(empty);

  useEffect(() => {
    setForm(editingBook || empty);
  }, [editingBook]);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...form,
      year: Number(form.year),
      quantity: Number(form.quantity),
    });
    setForm(empty);
  };

  return (
    <form onSubmit={handleSubmit} className="book-form">
      <input name="title" placeholder="Title" value={form.title} onChange={handleChange} required />
      <input name="author" placeholder="Author" value={form.author} onChange={handleChange} required />
      <input name="publisher" placeholder="Publisher" value={form.publisher} onChange={handleChange} required />
      <input name="year" type="number" placeholder="Year" value={form.year} onChange={handleChange} required />
      <input name="quantity" type="number" placeholder="Quantity" value={form.quantity} onChange={handleChange} required />
      <button type="submit">{editingBook ? "Update" : "Add"} Book</button>
      {editingBook && <button type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}