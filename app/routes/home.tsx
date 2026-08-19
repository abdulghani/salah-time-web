import { Link } from "react-router";
import type { Route } from "./+types/home";
import { Countdown } from "~/components/countdown";
import { useNow } from "~/lib/use-now";
import { METHODS, loadSettings } from "~/lib/settings";
import {
  PRAYERS,
  addDays,
  calculateDay,
  civilDateIn,
  currentPrayerAt,
  formatCivilDate,
  formatGregorian,
  formatHijri,
  formatTime,
  nextPrayerAt,
  parseCivilDate,
} from "~/lib/prayer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Salah Times — daily prayer timetable" },
    {
      name: "description",
      content:
        "Accurate daily prayer times with next-prayer countdown, monthly timetable, and per-location settings.",
    },
  ];
}

export async function clientLoader({ request }: Route.ClientLoaderArgs) {
  const { settings } = loadSettings();
  const url = new URL(request.url);
  const today = civilDateIn(settings.timeZone);
  const date = parseCivilDate(url.searchParams.get("date")) ?? today;
  return {
    settings,
    date,
    today,
    isToday: formatCivilDate(date) === formatCivilDate(today),
    day: calculateDay(settings, date),
  };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { settings, date, today, isToday, day } = loaderData;
  const now = useNow(1000);

  const next = isToday ? nextPrayerAt(settings, now) : null;
  const current = isToday ? currentPrayerAt(settings, now) : null;
  const currentPrayer = PRAYERS.find((prayer) => prayer.key === current?.key);

  return (
    <div className="space-y-5">
      <DateNav date={date} today={today} isToday={isToday} settings={settings} />

      <section className="pattern-stars card relative overflow-hidden p-5 sm:p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-600/25 via-transparent to-transparent" />
        <div className="relative">
          {next ? (
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="text-left">
                <p className="text-[10px] tracking-[0.18em] text-ink-subtle uppercase">
                  Current
                </p>
                {current && currentPrayer ? (
                  <>
                    <p className="mt-1 text-xl font-semibold sm:text-2xl">
                      {currentPrayer.name}
                    </p>
                    <p className="text-xs tabular-nums text-ink-muted">
                      {formatTime(current.at, settings)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-base font-semibold text-ink-muted">—</p>
                )}
              </div>

              <div className="text-center">
                <Countdown ms={next.at.getTime() - now.getTime()} />
                <p className="text-[10px] tracking-[0.18em] text-ink-subtle uppercase">
                  until {next.name}
                </p>
              </div>

              <div className="text-right">
                <p className="text-[10px] tracking-[0.18em] text-accent uppercase">
                  {formatCivilDate(next.date) === formatCivilDate(today)
                    ? "Next"
                    : "Next · tomorrow"}
                </p>
                <p className="mt-1 text-xl font-semibold sm:text-2xl">{next.name}</p>
                <p className="text-xs tabular-nums text-ink-muted">
                  {formatTime(next.at, settings)}
                </p>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs tracking-[0.2em] text-accent uppercase">Timetable</p>
              <h2 className="mt-2 text-2xl font-semibold">
                {formatGregorian(date, settings.timeZone)}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                {formatHijri(date, settings.timeZone)}
              </p>
            </>
          )}
        </div>
      </section>

      <section className="card divide-y divide-line overflow-hidden">
        {PRAYERS.map((prayer) => {
          const at = day.times[prayer.key];
          const isCurrent = current?.key === prayer.key;
          const isNext =
            next?.key === prayer.key && formatCivilDate(next.date) === formatCivilDate(date);
          return (
            <div
              key={prayer.key}
              className={`flex items-center gap-4 px-5 py-4 transition ${
                isCurrent ? "bg-brand-500/10" : ""
              }`}
            >
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${
                  isCurrent ? "bg-brand-400" : isNext ? "bg-gold-400" : "bg-line"
                }`}
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 font-medium">
                  {prayer.name}
                  {isCurrent && (
                    <span className="rounded-full bg-brand-500/20 px-2 py-0.5 text-[10px] tracking-wide text-accent uppercase">
                      Now
                    </span>
                  )}
                </p>
                <p className="text-xs text-ink-muted">{prayer.note}</p>
              </div>
              <span className="font-arabic text-lg text-ink-muted">{prayer.arabic}</span>
              <span className="w-24 text-right text-lg font-semibold tabular-nums sm:text-xl">
                {formatTime(at, settings)}
              </span>
            </div>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        <NightCard
          label="Midnight"
          hint="Midpoint between Maghrib and Fajr"
          value={formatTime(day.middleOfTheNight, settings)}
        />
        <NightCard
          label="Last third of the night"
          hint="Begins qiyam / tahajjud time"
          value={formatTime(day.lastThirdOfTheNight, settings)}
        />
      </section>

      <p className="px-1 text-xs text-ink-subtle">
        {settings.city}
        {settings.country ? `, ${settings.country}` : ""} · {settings.timeZone} ·{" "}
        <Link to="/settings" className="text-accent underline underline-offset-2">
          {settings.madhab === "hanafi" ? "Hanafi" : "Shafi"} asr · {METHODS[settings.method]}
        </Link>
      </p>
    </div>
  );
}

function NightCard({ label, hint, value }: { label: string; hint: string; value: string }) {
  return (
    <div className="card flex items-center justify-between gap-3 p-4">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-ink-muted">{hint}</p>
      </div>
      <span className="text-lg font-semibold tabular-nums">{value}</span>
    </div>
  );
}

function DateNav({
  date,
  today,
  isToday,
  settings,
}: {
  date: ReturnType<typeof civilDateIn>;
  today: ReturnType<typeof civilDateIn>;
  isToday: boolean;
  settings: { timeZone: string };
}) {
  const link = (offset: number) => `/?date=${formatCivilDate(addDays(date, offset))}`;
  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        to={link(-1)}
        aria-label="Previous day"
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition hover:border-brand-500/50 hover:text-ink"
      >
        ‹
      </Link>
      <div className="text-center">
        <p className="text-sm font-medium">{formatGregorian(date, settings.timeZone)}</p>
        <p className="text-xs text-ink-muted">{formatHijri(date, settings.timeZone)}</p>
        {!isToday && (
          <Link
            to={`/?date=${formatCivilDate(today)}`}
            className="text-xs text-accent underline underline-offset-2"
          >
            back to today
          </Link>
        )}
      </div>
      <Link
        to={link(1)}
        aria-label="Next day"
        className="grid h-9 w-9 place-items-center rounded-full border border-line text-ink-muted transition hover:border-brand-500/50 hover:text-ink"
      >
        ›
      </Link>
    </div>
  );
}
