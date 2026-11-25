import axios from "axios";

const api = axios.create({
  baseURL: "https://localhost:7176/api/Book", // change the port to yours
});

export const getBooks = () => api.get("/GetBooks");
export const addBook = (book) => api.post("/AddBook", book);
export const updateBook = (id, book) => api.patch(`/UpdateBook/${id}`, book);
export const deleteBook = (id) => api.delete(`/Delete/${id}`);