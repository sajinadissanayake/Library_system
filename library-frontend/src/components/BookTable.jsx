export default function BookTable({ books, onEdit, onDelete }) {
  return (
    <table>
      <thead>
        <tr>
          <th>ID</th><th>Title</th><th>Author</th>
          <th>Publisher</th><th>Year</th><th>Qty</th><th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {books.map((b) => (
          <tr key={b.id}>
            <td>{b.id}</td>
            <td>{b.title}</td>
            <td>{b.author}</td>
            <td>{b.publisher}</td>
            <td>{b.year}</td>
            <td>{b.quantity}</td>
            <td>
              <button onClick={() => onEdit(b)}>Edit</button>
              <button onClick={() => onDelete(b.id)}>Delete</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}