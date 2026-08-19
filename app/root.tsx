import { isRouteErrorResponse, Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";

import type { Route } from "./+types/root";
import { themeBootstrapScript } from "~/lib/theme";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: `${import.meta.env.BASE_URL}favicon.svg`, type: "image/svg+xml" },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,300..800&family=Noto+Naskh+Arabic:wght@500;700&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
        />
        <meta
          name="theme-color"
          media="(prefers-color-scheme: light)"
          content="#f4f8f7"
        />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content="#0f1522" />
        <Meta />
        <Links />
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
      </head>
      <body className="min-h-full antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

/** SPA mode renders this on the server-generated shell until hydration finishes. */
export function HydrateFallback() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4">
      <div className="relative h-14 w-14">
        <span className="absolute inset-0 rounded-full border-2 border-brand-500/60" />
        <span className="absolute inset-0 animate-pulse-ring rounded-full border-2 border-brand-400" />
      </div>
      <p className="text-sm tracking-widest text-ink-muted uppercase">Salah Times</p>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Something went wrong";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "Page not found" : `Error ${error.status}`;
    details =
      error.status === 404
        ? "That page does not exist."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6">
      <h1 className="text-3xl font-semibold">{message}</h1>
      <p className="text-ink-muted">{details}</p>
      <a href="/" className="text-accent underline underline-offset-4">
        Back to prayer times
      </a>
      {stack && (
        <pre className="card overflow-x-auto p-4 text-xs text-ink-muted">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
