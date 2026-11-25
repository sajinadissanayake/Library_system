export const memberCode = (id) => `M${String(id).padStart(4, "0")}`;

export const apiError = (e) => e.response?.data?.message || e.message;

export const fmt = (d) => (d ? new Date(d).toLocaleDateString() : "–");

export const money = (n) => `Rs. ${Number(n || 0).toFixed(2)}`;

export const issueStatus = (i) => {
  if (i.returnDate) return "Returned";
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return new Date(i.dueDate) < start ? "Overdue" : "Issued";
};