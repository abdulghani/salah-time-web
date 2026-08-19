import { browserTimeZone, loadSettings, saveSettings } from "./settings";

const PROMPTED_KEY = "salah-times:location-prompted";

export type DetectedLocation = {
  latitude: number;
  longitude: number;
  timeZone: string;
  city: string;
  country: string;
};

/** Promise wrapper around the callback-style geolocation API. */
export function requestLocation(): Promise<DetectedLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timeZone: browserTimeZone(),
          city: "Current location",
          country: "",
        }),
      (error) => reject(error),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  });
}

export function storeLocation(location: DetectedLocation) {
  const { settings } = loadSettings();
  return saveSettings({ ...settings, ...location });
}

/**
 * The permission prompt is only raised once per browser; after that the user
 * picks a city in Settings instead of being asked again on every visit.
 */
export function hasAskedForLocation() {
  try {
    return localStorage.getItem(PROMPTED_KEY) === "1";
  } catch {
    return true;
  }
}

export function markAskedForLocation() {
  try {
    localStorage.setItem(PROMPTED_KEY, "1");
  } catch {
    /* storage unavailable — the prompt simply repeats next visit */
  }
}

export function forgetLocationPrompt() {
  try {
    localStorage.removeItem(PROMPTED_KEY);
  } catch {
    /* nothing to clear */
  }
}

/** True when the browser already knows the user refused, so we skip asking. */
export async function isLocationBlocked() {
  if (!navigator.permissions?.query) return false;
  try {
    const status = await navigator.permissions.query({
      name: "geolocation" as PermissionName,
    });
    return status.state === "denied";
  } catch {
    return false;
  }
}
