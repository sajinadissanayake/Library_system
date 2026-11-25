import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard", icon: "▦" },
  { to: "/books", label: "Books", icon: "📚" },
  { to: "/members", label: "Members", icon: "👥" },
  { to: "/issue", label: "Issue Books", icon: "📤" },
  { to: "/return", label: "Return Books", icon: "📥" },
  { to: "/reports", label: "Reports", icon: "📊" },
];

export default function Layout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">📖 LibraryMS</div>
        <nav>
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className="nav-item">
              <span>{l.icon}</span> {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="main">
        <header className="topbar">
          <span>Library Management System</span>
          <span className="user">Librarian</span>
        </header>
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}