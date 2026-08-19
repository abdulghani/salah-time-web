import type { Config } from "@react-router/dev/config";

// GitHub Pages serves project sites from /<repo>/, so both Vite's asset base
// and the router's basename are prefixed in production.
const base = process.env.APP_BASE ?? "/";

export default {
  // SPA mode: no runtime server. The build emits a static client bundle and
  // every route loads its data in the browser via `clientLoader`.
  ssr: false,
  basename: base,
} satisfies Config;
