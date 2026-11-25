import axios from "axios";

const api = axios.create({ baseURL: "https://localhost:7176/api/Issue" });

export const getIssues = () => api.get("/GetIssues");
export const checkAvailability = (bookId) => api.get(`/CheckAvailability/${bookId}`);
export const issueBook = (data) => api.post("/IssueBook", data);

// NEW - returns
export const getActiveLoans = () => api.get("/GetActiveLoans");
export const calculateFine = (id) => api.get(`/CalculateFine/${id}`);
export const returnBook = (id) => api.post(`/ReturnBook/${id}`);