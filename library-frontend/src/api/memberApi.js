import axios from "axios";

const api = axios.create({ baseURL: "https://localhost:7176/api/Member" });

export const getMembers = () => api.get("/GetMembers");
export const addMember = (m) => api.post("/AddMember", m);
export const updateMember = (id, m) => api.patch(`/UpdateMember/${id}`, m);
export const deleteMember = (id) => api.delete(`/Delete/${id}`);