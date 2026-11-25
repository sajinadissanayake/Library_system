import axios from "axios";

const api = axios.create({ baseURL: "https://localhost:7176/api/Report" });

export const getBorrowingHistory = (from, to) =>
  api.get("/BorrowingHistory", { params: { from: from || undefined, to: to || undefined } });
export const getReturnedBooks = () => api.get("/ReturnedBooks");
export const getOverdueBooks = () => api.get("/OverdueBooks");
export const getMemberHistory = (memberId) => api.get(`/MemberHistory/${memberId}`);
export const getBookInventory = () => api.get("/BookInventory");