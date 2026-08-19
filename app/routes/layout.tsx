import { useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router";
import type { Route } from "./+types/layout";
import { loadSettings } from "~/lib/settings";
import { applyTheme } from "~/lib/theme";

export async function clientLoader() {
  const { settings, hasLocation } = loadSettings();
  return {
    city: settings.city,
    country: settings.country,
    theme: settings.theme,
    hasLocation,
  };
}

const NAV = [
  { to: "/", label: "Today", end: true },
  { to: "/month", label: "Month", end: false },
];

export default function AppLayout({ loaderData }: Route.ComponentProps) {
  const { city, country, theme, hasLocation } = loaderData;
  const location = useLocation();

  // Re-applied on every navigation so saving a new theme takes effect at once.
  useEffect(() => applyTheme(theme), [theme]);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 pb-10 sm:px-6">
      <header className="flex items-center justify-between gap-4 py-6">
        <NavLink to="/" className="group flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-500/15 text-lg ring-1 ring-brand-500/30">
            🕌
          </span>
          <span className="leading-tight">
            <span className="block text-sm font-semibold tracking-wide">Salah Times</span>
            <span className="block text-xs text-ink-muted">
              {city}
              {country ? `, ${country}` : ""}
            </span>
          </span>
        </NavLink>
        <NavLink
          to="/settings"
          aria-label="Settings"
          className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted transition hover:border-brand-500/50 hover:text-ink"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.6 1.6 0 0 0 .32 1.77l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.6 1.6 0 0 0-1.77-.32 1.6 1.6 0 0 0-1 1.47V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1.05-1.46 1.6 1.6 0 0 0-1.77.32l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.6 1.6 0 0 0 .32-1.77 1.6 1.6 0 0 0-1.47-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.46-1.05 1.6 1.6 0 0 0-.32-1.77l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.6 1.6 0 0 0 1.77.32H9a1.6 1.6 0 0 0 1-1.47V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.47 1.6 1.6 0 0 0 1.77-.32l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.6 1.6 0 0 0-.32 1.77V9a1.6 1.6 0 0 0 1.47 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
          </svg>
          Settings
        </NavLink>
      </header>

      {!hasLocation && location.pathname !== "/settings" && (
        <p className="mb-4 rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-sm text-warn">
          Showing times for Makkah — set your location for accurate times.
        </p>
      )}

      <nav className="mb-5 flex gap-1 rounded-xl border border-line bg-elevated p-1">
        {NAV.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex-1 rounded-lg py-2 text-center text-xs font-medium transition ${
                isActive
                  ? "bg-brand-500/15 text-accent"
                  : "text-ink-muted hover:text-ink"
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
