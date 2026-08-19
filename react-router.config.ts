import type { Config } from "@react-router/dev/config";

export default {
  // SPA mode: no runtime server. The build emits a static client bundle and
  // every route loads its data in the browser via `clientLoader`.
  ssr: false,
} satisfies Config;
