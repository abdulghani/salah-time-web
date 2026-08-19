import { Link } from "react-router";
import type { Route } from "./+types/month";
import { METHODS, loadSettings } from "~/lib/settings";
import {
  PRAYERS,
  calculateMonth,
  civilDateIn,
  formatCivilDate,
  formatHijri,
  formatTime,
} from "~/lib/prayer";

export function meta({}: Route.MetaArgs) {
  return [{ title: "Monthly timetable — Salah Times" }];
}

function parseMonth(value: string | null) {
  const match = /^(\d{4})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const [year, month] = [+match[1], +match[2]];
  if (month < 1 || month > 12) return null;
  return { year, month };
}

function shiftMonth(year: number, month: number, delta: number) {
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const { settings } = loadSettings();
  const today = civilDateIn(settings.timeZone);
  const url = new URL(request.url);
  const { year, month } =
    parseMonth(url.searchParams.get("month")) ?? { year: today.year, month: today.month };
  return { settings, today, year, month, days: calculateMonth(settings, year, month) };
}

export default function Month({ loaderData }: Route.ComponentProps) {
  const { settings, today, year, month, days } = loaderData;
  const label = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Link
          to={`/month?month=${shiftMonth(year, month, -1)}`}
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition hover:border-brand-500/50 hover:text-ink"
          aria-label="Previous month"
        >
          ‹
        </Link>
        <div className="text-center">
          <h1 className="text-lg font-semibold">{label}</h1>
          <p className="text-xs text-ink-muted">
            {settings.city}
            {settings.country ? `, ${settings.country}` : ""}
          </p>
        </div>
        <Link
          to={`/month?month=${shiftMonth(year, month, 1)}`}
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition hover:border-brand-500/50 hover:text-ink"
          aria-label="Next month"
        >
          ›
        </Link>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-sm">
          <thead>
            <tr className="text-xs tracking-wide text-ink-muted uppercase">
              <th className="sticky left-0 bg-surface/95 px-3 py-3 text-left backdrop-blur">
                Day
              </th>
              {PRAYERS.map((prayer) => (
                <th key={prayer.key} className="px-3 py-3 text-right font-medium">
                  {prayer.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {days.map((day) => {
              const isToday = formatCivilDate(day.date) === formatCivilDate(today);
              return (
                <tr key={day.date.day} className={isToday ? "bg-brand-500/10" : ""}>
                  <th className="sticky left-0 bg-surface/95 px-3 py-2.5 text-left font-normal backdrop-blur">
                    <Link
                      to={`/?date=${formatCivilDate(day.date)}`}
                      className="block hover:text-accent"
                    >
                      <span className={isToday ? "font-semibold text-accent" : ""}>
                        {new Intl.DateTimeFormat("en-US", {
                          weekday: "short",
                          day: "numeric",
                        }).format(new Date(day.date.year, day.date.month - 1, day.date.day))}
                      </span>
                      <span className="block text-[10px] text-ink-subtle">
                        {formatHijri(day.date, settings.timeZone).replace(/ AH$/, "")}
                      </span>
                    </Link>
                  </th>
                  {PRAYERS.map((prayer) => (
                    <td
                      key={prayer.key}
                      className="px-3 py-2.5 text-right tabular-nums text-ink"
                    >
                      {formatTime(day.times[prayer.key], settings)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="px-1 text-xs text-ink-subtle">
        Tap a day to open its full timetable. Times use {METHODS[settings.method]},{" "}
        {settings.madhab === "hanafi" ? "Hanafi" : "Shafi"} asr.
      </p>
    </div>
  );
}
