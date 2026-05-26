import { NavLink, Outlet } from "react-router";
import ErrorBoundary from "./ErrorBoundary";

const navItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/activities", label: "Activities" },
  { to: "/health", label: "Health" },
];

export default function Layout() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar — desktop only */}
      <nav className="hidden md:flex w-48 bg-white border-r border-gray-200 flex-col p-4 gap-1 shrink-0">
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

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4 md:p-6 pb-20 md:pb-6">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>

      {/* Bottom nav — mobile only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex">
        {navItems.map(({ to, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex-1 py-3 text-xs font-medium text-center transition-colors ${
                isActive ? "text-blue-600" : "text-gray-400"
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
