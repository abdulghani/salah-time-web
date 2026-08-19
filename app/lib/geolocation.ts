import { browserTimeZone, loadSettings, saveSettings } from "./settings";

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
