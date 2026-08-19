import { STORAGE_KEY, type ThemeKey } from "./settings";

/**
 * Reflects the chosen theme onto <html data-theme>. "system" removes the
 * attribute so the `prefers-color-scheme` rules in app.css take over.
 */
export function applyTheme(theme: ThemeKey) {
  const root = document.documentElement;
  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;
}

/**
 * Runs inline in <head> so the first paint already has the right theme — the
 * SPA shell is static HTML, so waiting for hydration would flash the wrong one.
 */
export const themeBootstrapScript = `
try {
  var s = JSON.parse(localStorage.getItem(${JSON.stringify(STORAGE_KEY)}) || "{}");
  if (s.theme === "light" || s.theme === "dark") {
    document.documentElement.dataset.theme = s.theme;
  }
} catch (e) {}
`.trim();
