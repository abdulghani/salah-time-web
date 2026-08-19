import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/layout.tsx", [
    index("routes/home.tsx"),
    route("month", "routes/month.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
