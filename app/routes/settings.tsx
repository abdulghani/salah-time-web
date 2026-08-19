import { useEffect, useRef, useState } from "react";
import { Form, redirect, useFetcher, useSubmit } from "react-router";
import type { Route } from "./+types/settings";
import {
  HIGH_LATITUDE_RULES,
  METHODS,
  THEMES,
  clearSettings,
  loadSettings,
  saveSettings,
  type Settings,
} from "~/lib/settings";
import { requestLocation } from "~/lib/geolocation";
import { applyTheme } from "~/lib/theme";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Settings — Salah Times" }];
}

export async function clientLoader() {
  return loadSettings();
}

export async function clientAction({ request }: Route.ClientActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const { settings } = loadSettings();

  if (intent === "reset") {
    clearSettings();
    return redirect("/settings");
  }

  if (intent === "location") {
    saveSettings({
      ...settings,
      latitude: Number(formData.get("latitude")),
      longitude: Number(formData.get("longitude")),
      city: String(formData.get("city") ?? ""),
      country: String(formData.get("country") ?? ""),
      timeZone: String(formData.get("timeZone") ?? ""),
    });
    return redirect("/");
  }

  const saved = saveSettings({
    ...settings,
    method: formData.get("method") as Settings["method"],
    madhab: formData.get("madhab") as Settings["madhab"],
    highLatitudeRule: formData.get(
      "highLatitudeRule",
    ) as Settings["highLatitudeRule"],
    timeFormat: formData.get("timeFormat") as Settings["timeFormat"],
    theme: formData.get("theme") as Settings["theme"],
  });
  applyTheme(saved.theme);
  return { saved: true };
}

type Place = {
  id: number;
  name: string;
  admin1?: string;
  country?: string;
  latitude: number;
  longitude: number;
  timezone: string;
};

export default function SettingsRoute({ loaderData }: Route.ComponentProps) {
  const { settings, hasLocation } = loaderData;
  const submit = useSubmit();
  const preferences = useFetcher();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  // Debounced city search against Open-Meteo's public geocoding API.
  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults(null);
      return;
    }
    const id = ++requestId.current;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&format=json&name=${encodeURIComponent(term)}`,
          { signal: controller.signal },
        );
        const body = (await response.json()) as { results?: Place[] };
        if (id === requestId.current) setResults(body.results ?? []);
      } catch (cause) {
        if (id === requestId.current && !controller.signal.aborted) {
          setError("Could not reach the location search service.");
        }
      } finally {
        if (id === requestId.current) setSearching(false);
      }
    }, 300);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  async function useMyLocation() {
    setError(null);
    setLocating(true);
    try {
      const location = await requestLocation();
      submit({ intent: "location", ...location }, { method: "post" });
    } catch {
      setError("Could not read your location — permission may be blocked.");
    } finally {
      setLocating(false);
    }
  }

  return (
    <div className="space-y-6 pb-6">
      <header>
        <h1 className="text-lg font-semibold">Settings</h1>
        <p className="text-xs text-ink-muted">
          Stored in this browser only — nothing is sent to a server.
        </p>
      </header>

      <section className="card space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-medium">Location</h2>
            <p className="text-sm text-ink-muted">
              {hasLocation ? (
                <>
                  {settings.city}
                  {settings.country ? `, ${settings.country}` : ""} · {settings.timeZone}
                </>
              ) : (
                "Not set — using Makkah"
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            className="shrink-0 rounded-lg border border-line px-3 py-2 text-xs transition hover:border-brand-500/50 disabled:opacity-60"
          >
            {locating ? "Locating…" : "Use my location"}
          </button>
        </div>

        <div>
          <label htmlFor="city-search" className="sr-only">
            Search for a city
          </label>
          <input
            id="city-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search for a city…"
            autoComplete="off"
            className="w-full rounded-xl border border-line bg-field px-4 py-3 text-sm outline-none placeholder:text-ink-subtle focus:border-brand-500/60"
          />
        </div>

        {searching && <p className="text-xs text-ink-subtle">Searching…</p>}
        {results?.length === 0 && !searching && (
          <p className="text-xs text-ink-subtle">No matching places.</p>
        )}

        {!!results?.length && (
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {results.map((place) => (
              <li key={place.id}>
                <Form method="post" className="contents">
                  <input type="hidden" name="intent" value="location" />
                  <input type="hidden" name="latitude" value={place.latitude} />
                  <input type="hidden" name="longitude" value={place.longitude} />
                  <input type="hidden" name="city" value={place.name} />
                  <input type="hidden" name="country" value={place.country ?? ""} />
                  <input type="hidden" name="timeZone" value={place.timezone} />
                  <button
                    type="submit"
                    className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition hover:bg-elevated"
                  >
                    <span>
                      <span className="font-medium">{place.name}</span>
                      <span className="block text-xs text-ink-muted">
                        {[place.admin1, place.country].filter(Boolean).join(", ")}
                      </span>
                    </span>
                    <span className="text-xs text-ink-subtle">{place.timezone}</span>
                  </button>
                </Form>
              </li>
            ))}
          </ul>
        )}
        {error && <p className="text-sm text-warn">{error}</p>}
      </section>

      <preferences.Form
        method="post"
        className="card space-y-5 p-5"
        onChange={(event) => preferences.submit(event.currentTarget)}
      >
        <input type="hidden" name="intent" value="preferences" />
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-medium">Calculation</h2>
          <span className="text-xs text-ink-subtle">
            {preferences.state === "idle" ? "Saves automatically" : "Saving…"}
          </span>
        </div>

        <Field label="Method" hint="Twilight angles used for Fajr and Isha">
          <select
            name="method"
            defaultValue={settings.method}
            className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-sm outline-none focus:border-brand-500/60"
          >
            {Object.entries(METHODS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Asr madhab" hint="Hanafi uses a longer afternoon shadow">
          <div className="grid grid-cols-2 gap-2">
            {(["shafi", "hanafi"] as const).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm has-checked:border-brand-500/60 has-checked:bg-brand-500/10"
              >
                <input
                  type="radio"
                  name="madhab"
                  value={value}
                  defaultChecked={settings.madhab === value}
                  className="accent-brand-500"
                />
                {value === "shafi" ? "Shafi / Maliki / Hanbali" : "Hanafi"}
              </label>
            ))}
          </div>
        </Field>

        <Field label="High latitude rule" hint="Used where twilight never ends in summer">
          <select
            name="highLatitudeRule"
            defaultValue={settings.highLatitudeRule}
            className="w-full rounded-xl border border-line bg-field px-3 py-2.5 text-sm outline-none focus:border-brand-500/60"
          >
            {Object.entries(HIGH_LATITUDE_RULES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Time format">
          <div className="grid grid-cols-2 gap-2">
            {(["12h", "24h"] as const).map((value) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm has-checked:border-brand-500/60 has-checked:bg-brand-500/10"
              >
                <input
                  type="radio"
                  name="timeFormat"
                  value={value}
                  defaultChecked={settings.timeFormat === value}
                  className="accent-brand-500"
                />
                {value === "12h" ? "12-hour" : "24-hour"}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Appearance" hint="Follows your device by default">
          <div className="grid grid-cols-3 gap-2">
            {Object.entries(THEMES).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-line px-3 py-2.5 text-sm has-checked:border-brand-500/60 has-checked:bg-brand-500/10"
              >
                <input
                  type="radio"
                  name="theme"
                  value={value}
                  defaultChecked={settings.theme === value}
                  className="sr-only"
                />
                {label}
              </label>
            ))}
          </div>
        </Field>

      </preferences.Form>

      <Form method="post">
        <button
          type="submit"
          name="intent"
          value="reset"
          className="text-xs text-ink-subtle underline underline-offset-2 hover:text-ink-muted"
        >
          Reset everything to defaults
        </button>
      </Form>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {hint && <p className="text-xs text-ink-muted">{hint}</p>}
      </div>
      {children}
    </div>
  );
}
