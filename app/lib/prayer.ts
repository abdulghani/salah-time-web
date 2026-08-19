import {
  CalculationMethod,
  CalculationParameters,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
  SunnahTimes,
} from "adhan";
import { CUSTOM_METHOD_ANGLES, type MethodKey, type Settings } from "./settings";

export const PRAYERS = [
  { key: "fajr", name: "Fajr", arabic: "الفجر", note: "Dawn" },
  { key: "sunrise", name: "Sunrise", arabic: "الشروق", note: "Shurooq" },
  { key: "dhuhr", name: "Dhuhr", arabic: "الظهر", note: "Midday" },
  { key: "asr", name: "Asr", arabic: "العصر", note: "Afternoon" },
  { key: "maghrib", name: "Maghrib", arabic: "المغرب", note: "Sunset" },
  { key: "isha", name: "Isha", arabic: "العشاء", note: "Night" },
] as const;

export type PrayerKey = (typeof PRAYERS)[number]["key"];

export type CivilDate = { year: number; month: number; day: number };

/** The calendar date at `instant`, as seen in `timeZone`. */
export function civilDateIn(timeZone: string, instant: Date = new Date()): CivilDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

export function formatCivilDate({ year, month, day }: CivilDate) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function parseCivilDate(value: string | null): CivilDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const [year, month, day] = [+match[1], +match[2], +match[3]];
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { year, month, day };
}

export function addDays(date: CivilDate, days: number): CivilDate {
  const d = new Date(date.year, date.month - 1, date.day + days, 12);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
}

export function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

/**
 * adhan reads Y/M/D off the Date using the *runtime's* local time, so we build
 * a noon-local Date to pin the intended calendar day regardless of where the
 * browser sits relative to the location being calculated.
 */
function anchorDate({ year, month, day }: CivilDate) {
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function baseParameters(method: MethodKey) {
  const custom = CUSTOM_METHOD_ANGLES[method];
  if (custom) {
    return new CalculationParameters(null, custom.fajrAngle, custom.ishaAngle);
  }
  return CalculationMethod[method as keyof typeof CalculationMethod]();
}

function calculationParameters(settings: Settings) {
  const params = baseParameters(settings.method);
  params.madhab = settings.madhab === "hanafi" ? Madhab.Hanafi : Madhab.Shafi;
  params.highLatitudeRule =
    settings.highLatitudeRule === "auto"
      ? HighLatitudeRule.recommended(
          new Coordinates(settings.latitude, settings.longitude),
        )
      : settings.highLatitudeRule;
  return params;
}

export type DayTimes = {
  date: CivilDate;
  times: Record<PrayerKey, Date>;
  middleOfTheNight: Date;
  lastThirdOfTheNight: Date;
};

export function calculateDay(settings: Settings, date: CivilDate): DayTimes {
  const coordinates = new Coordinates(settings.latitude, settings.longitude);
  const prayerTimes = new PrayerTimes(
    coordinates,
    anchorDate(date),
    calculationParameters(settings),
  );
  const sunnah = new SunnahTimes(prayerTimes);
  return {
    date,
    times: {
      fajr: prayerTimes.fajr,
      sunrise: prayerTimes.sunrise,
      dhuhr: prayerTimes.dhuhr,
      asr: prayerTimes.asr,
      maghrib: prayerTimes.maghrib,
      isha: prayerTimes.isha,
    },
    middleOfTheNight: sunnah.middleOfTheNight,
    lastThirdOfTheNight: sunnah.lastThirdOfTheNight,
  };
}

export function calculateMonth(settings: Settings, year: number, month: number) {
  return Array.from({ length: daysInMonth(year, month) }, (_, i) =>
    calculateDay(settings, { year, month, day: i + 1 }),
  );
}

/**
 * The upcoming prayer at `now`, searching today then rolling into tomorrow so
 * the answer after Isha is tomorrow's Fajr.
 */
export function nextPrayerAt(settings: Settings, now: Date) {
  const today = civilDateIn(settings.timeZone, now);
  const days = [calculateDay(settings, today), calculateDay(settings, addDays(today, 1))];
  for (const day of days) {
    for (const prayer of PRAYERS) {
      const at = day.times[prayer.key];
      if (at.getTime() > now.getTime()) {
        return { ...prayer, at, date: day.date };
      }
    }
  }
  return null;
}

/** The prayer whose window is currently open (sunrise counts as "after Fajr"). */
export function currentPrayerAt(settings: Settings, now: Date) {
  const today = civilDateIn(settings.timeZone, now);
  const days = [calculateDay(settings, addDays(today, -1)), calculateDay(settings, today)];
  let current: { key: PrayerKey; at: Date } | null = null;
  for (const day of days) {
    for (const prayer of PRAYERS) {
      const at = day.times[prayer.key];
      if (at.getTime() <= now.getTime()) current = { key: prayer.key, at };
    }
  }
  return current;
}

export function timeFormatter(settings: Settings) {
  return new Intl.DateTimeFormat(settings.timeFormat === "24h" ? "en-GB" : "en-US", {
    timeZone: settings.timeZone,
    hour: settings.timeFormat === "24h" ? "2-digit" : "numeric",
    minute: "2-digit",
    hour12: settings.timeFormat === "12h",
  });
}

export function formatTime(date: Date, settings: Settings) {
  return timeFormatter(settings).format(date);
}

export function formatGregorian(date: CivilDate, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(anchorDate(date));
}

export function formatHijri(date: CivilDate, timeZone: string) {
  return new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
    timeZone,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(anchorDate(date));
}

/** Splits a millisecond span into whole hours / minutes / seconds. */
export function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}
