export const METHODS = {
  MuslimWorldLeague: "Muslim World League",
  Egyptian: "Egyptian General Authority",
  Karachi: "Univ. of Islamic Sciences, Karachi",
  Kemenag: "Kemenag (Indonesia)",
  UmmAlQura: "Umm al-Qura, Makkah",
  Dubai: "Dubai",
  Qatar: "Qatar",
  Kuwait: "Kuwait",
  MoonsightingCommittee: "Moonsighting Committee",
  NorthAmerica: "ISNA (North America)",
  Singapore: "Singapore",
  Tehran: "Institute of Geophysics, Tehran",
  Turkey: "Diyanet, Turkey",
  Other: "Other (18° / 17°)",
} as const;

export type MethodKey = keyof typeof METHODS;

/** Methods adhan does not ship, expressed as raw Fajr / Isha twilight angles. */
export const CUSTOM_METHOD_ANGLES: Partial<
  Record<MethodKey, { fajrAngle: number; ishaAngle: number }>
> = {
  Kemenag: { fajrAngle: 20, ishaAngle: 18 },
};

export const THEMES = {
  system: "System",
  light: "Light",
  dark: "Dark",
} as const;

export type ThemeKey = keyof typeof THEMES;

export const HIGH_LATITUDE_RULES = {
  auto: "Recommended for location",
  middleofthenight: "Middle of the night",
  seventhofthenight: "One seventh of the night",
  twilightangle: "Twilight angle",
} as const;

export type HighLatitudeRuleKey = keyof typeof HIGH_LATITUDE_RULES;

export type Settings = {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timeZone: string;
  method: MethodKey;
  madhab: "shafi" | "hanafi";
  highLatitudeRule: HighLatitudeRuleKey;
  timeFormat: "12h" | "24h";
  theme: ThemeKey;
};

export const DEFAULT_SETTINGS: Settings = {
  latitude: 21.4225,
  longitude: 39.8262,
  city: "Makkah",
  country: "Saudi Arabia",
  timeZone: "Asia/Riyadh",
  method: "UmmAlQura",
  madhab: "shafi",
  highLatitudeRule: "auto",
  timeFormat: "12h",
  theme: "system",
};

export const STORAGE_KEY = "salah-times:settings:v1";

function clamp(value: unknown, fallback: number, min: number, max: number) {
  const parsed = typeof value === "string" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

export function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== "string" || !tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

/** Coerces an unknown payload (stored JSON or form data) into complete Settings. */
export function normalizeSettings(input: unknown): {
  settings: Settings;
  hasLocation: boolean;
} {
  const raw = (input ?? {}) as Record<string, unknown>;
  const hasLocation =
    Number.isFinite(Number(raw.latitude)) &&
    Number.isFinite(Number(raw.longitude)) &&
    isValidTimeZone(raw.timeZone);

  return {
    hasLocation,
    settings: {
      latitude: hasLocation
        ? clamp(raw.latitude, DEFAULT_SETTINGS.latitude, -90, 90)
        : DEFAULT_SETTINGS.latitude,
      longitude: hasLocation
        ? clamp(raw.longitude, DEFAULT_SETTINGS.longitude, -180, 180)
        : DEFAULT_SETTINGS.longitude,
      city: hasLocation
        ? String(raw.city || "Current location").slice(0, 80)
        : DEFAULT_SETTINGS.city,
      country: hasLocation ? String(raw.country ?? "").slice(0, 80) : DEFAULT_SETTINGS.country,
      timeZone: hasLocation ? (raw.timeZone as string) : DEFAULT_SETTINGS.timeZone,
      method:
        typeof raw.method === "string" && raw.method in METHODS
          ? (raw.method as MethodKey)
          : DEFAULT_SETTINGS.method,
      madhab: raw.madhab === "hanafi" ? "hanafi" : "shafi",
      highLatitudeRule:
        typeof raw.highLatitudeRule === "string" &&
        raw.highLatitudeRule in HIGH_LATITUDE_RULES
          ? (raw.highLatitudeRule as HighLatitudeRuleKey)
          : DEFAULT_SETTINGS.highLatitudeRule,
      timeFormat: raw.timeFormat === "24h" ? "24h" : "12h",
      theme:
        typeof raw.theme === "string" && raw.theme in THEMES
          ? (raw.theme as ThemeKey)
          : DEFAULT_SETTINGS.theme,
    },
  };
}

export function loadSettings() {
  if (typeof localStorage === "undefined") {
    return { settings: DEFAULT_SETTINGS, hasLocation: false };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeSettings(stored ? JSON.parse(stored) : null);
  } catch {
    return { settings: DEFAULT_SETTINGS, hasLocation: false };
  }
}

export function saveSettings(settings: Settings) {
  const { settings: normalized } = normalizeSettings(settings);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  return normalized;
}

export function clearSettings() {
  localStorage.removeItem(STORAGE_KEY);
}

/** Best guess at the browser's IANA time zone, falling back to UTC. */
export function browserTimeZone() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return isValidTimeZone(tz) ? tz : "UTC";
}
