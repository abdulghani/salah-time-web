import { useCallback, useEffect, useState } from "react";
import { NavLink, Outlet, useLocation, useRevalidator } from "react-router";
import type { Route } from "./+types/layout";
import {
  forgetLocationPrompt,
  hasAskedForLocation,
  isLocationBlocked,
  markAskedForLocation,
  requestLocation,
  storeLocation,
} from "~/lib/geolocation";
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

  // The header button doubles as the way back out of Settings.
  const onSettings = location.pathname === "/settings";

  // Re-applied on every navigation so saving a new theme takes effect at once.
  useEffect(() => applyTheme(theme), [theme]);

  const revalidator = useRevalidator();
  const [locationState, setLocationState] = useState<"idle" | "asking" | "refused">(
    "idle",
  );

  const askForLocation = useCallback(async () => {
    markAskedForLocation();
    setLocationState("asking");
    try {
      storeLocation(await requestLocation());
      setLocationState("idle");
      revalidator.revalidate();
    } catch {
      setLocationState("refused");
    }
  }, [revalidator]);

  // First visit with nothing saved: ask the browser for the user's position
  // rather than silently falling back to Makkah.
  useEffect(() => {
    if (hasLocation || hasAskedForLocation()) return;
    let cancelled = false;
    isLocationBlocked().then((blocked) => {
      if (cancelled) return;
      if (blocked) {
        markAskedForLocation();
        setLocationState("refused");
        return;
      }
      void askForLocation();
    });
    return () => {
      cancelled = true;
    };
  }, [hasLocation, askForLocation]);

  function retryLocation() {
    forgetLocationPrompt();
    void askForLocation();
  }

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
          to={onSettings ? "/" : "/settings"}
          aria-label={onSettings ? "Close settings" : "Settings"}
          className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
            onSettings
              ? "border-brand-500/50 bg-brand-500/10 text-accent"
              : "border-line text-ink-muted hover:border-brand-500/50 hover:text-ink"
          }`}
        >
          {onSettings ? <CloseIcon /> : <GearIcon />}
          {onSettings ? "Close" : "Settings"}
        </NavLink>
      </header>

      {!hasLocation && location.pathname !== "/settings" && (
        <button
          type="button"
          onClick={retryLocation}
          disabled={locationState === "asking"}
          className="mb-4 w-full rounded-xl border border-warn/40 bg-warn/10 px-4 py-3 text-left text-sm text-warn transition hover:bg-warn/20 disabled:cursor-progress disabled:opacity-70"
        >
          {locationState === "asking" ? (
            "Waiting for location permission…"
          ) : (
            <>
              Showing times for Makkah —{" "}
              <span className="font-medium underline underline-offset-2">
                set your location for accurate times
              </span>
              .
            </>
          )}
        </button>
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

function GearIcon() {
  return (
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
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
