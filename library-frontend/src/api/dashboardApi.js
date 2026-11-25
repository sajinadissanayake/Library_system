import axios from "axios";

const api = axios.create({ baseURL: "https://localhost:7176/api/Dashboard" });

export const getStats = () => api.get("/GetStats");