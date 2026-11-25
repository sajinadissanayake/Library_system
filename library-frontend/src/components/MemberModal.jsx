import { useState } from "react";

// Old NIC: 9 digits + V/X. New NIC: 12 digits.
const NIC_REGEX = /^(\d{9}[VvXx]|\d{12})$/;

export default function MemberModal({ member, onSave, onClose }) {
  const isEdit = !!member.id;
  const [form, setForm] = useState({
    name: member.name ?? "",
    nic: member.nic ?? "",
    phone: member.phone ?? "",
    email: member.email ?? "",
  });
  const [err, setErr] = useState("");

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = (e) => {
    e.preventDefault();
    if (!NIC_REGEX.test(form.nic.trim()))
      return setErr("NIC must be 9 digits + V/X, or 12 digits.");
    onSave({
      ...(isEdit ? { id: member.id } : {}),
      ...form,
      nic: form.nic.trim().toUpperCase(),
    });
  };

  return (
    <div className="overlay" onClick={onClose}>
      <form className="modal" onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <h3>{isEdit ? "Edit Member" : "Register New Member"}</h3>
        {err && <div className="alert">{err}</div>}

        <label>Full Name<input name="name" value={form.name} onChange={change} required /></label>
        <label>NIC<input name="nic" value={form.nic} onChange={change} required /></label>
        <label>Phone<input name="phone" value={form.phone} onChange={change} /></label>
        <label>Email<input name="email" type="email" value={form.email} onChange={change} /></label>

        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn primary">{isEdit ? "Save Changes" : "Register"}</button>
        </div>
      </form>
    </div>
  );
}