import { useState, useEffect } from "react";
import { NavLink, Outlet } from "react-router";
import ErrorBoundary from "./ErrorBoundary";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/activities", label: "Activities" },
  { to: "/gear", label: "Gear" },
  { to: "/health", label: "Health" },
];

export default function Layout() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div>
            <div className="brand-name">Run</div>
            <div className="brand-sub">Dashboard</div>
          </div>
        </div>

        <nav className="nav">
          {navItems.map(({ to, label }) => (
            <NavLink key={to} to={to} className="nav-item">
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div>
            <span className="live-dot" />
            Live data
          </div>
          <button
            onClick={() => setDark((d) => !d)}
            style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--fg-muted)", fontSize: 11, background: "none", border: "none", cursor: "pointer", padding: 0 }}
            aria-label="Toggle dark mode"
          >
            {dark ? "☀ Light" : "☾ Dark"}
          </button>
        </div>
      </aside>

      <main className="main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </div>
  );
}
