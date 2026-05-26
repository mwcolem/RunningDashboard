import { NavLink, Outlet } from "react-router";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/activities", label: "Activities" },
  { to: "/health", label: "Health" },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      <nav className="w-48 bg-white border-r border-gray-200 flex flex-col p-4 gap-1">
        <span className="text-lg font-semibold text-gray-800 mb-4">Running</span>
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
