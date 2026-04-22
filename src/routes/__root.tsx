import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { ThemeBootstrap } from "@/components/layout/ThemeBootstrap";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--cp-bg)] px-4">
      <div className="max-w-md text-center">
        <p className="label-eyebrow">404</p>
        <h1 className="mt-4 font-display text-5xl text-[var(--cp-text)]">Page not found</h1>
        <p className="mt-3 text-[var(--cp-text-muted)]">
          The page you're looking for doesn't exist. Let's get you back to something delicious.
        </p>
        <div className="mt-7">
          <Link to="/" className="btn-cta">Back to home</Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Clare Pastries — Baked Fresh. Delivered with Love." },
      { name: "description", content: "Handcrafted artisan pastries, cakes and breads, baked fresh daily by Clare in Busia, Kenya. Order online with M-Pesa." },
      { name: "author", content: "Clare Pastries" },
      { name: "theme-color", content: "#F9F5EF" },
      { property: "og:title", content: "Clare Pastries — Baked Fresh. Delivered with Love." },
      { property: "og:description", content: "Handcrafted artisan pastries, cakes and breads, baked fresh daily by Clare in Busia, Kenya. Order online with M-Pesa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Clare Pastries — Baked Fresh. Delivered with Love." },
      { name: "twitter:description", content: "Handcrafted artisan pastries, cakes and breads, baked fresh daily by Clare in Busia, Kenya. Order online with M-Pesa." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/56910707-cb83-4cce-8576-59d5f89e0e60/id-preview-17a1a466--436699f0-83c9-47ee-9158-29cbe4108f62.lovable.app-1776834127823.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/56910707-cb83-4cce-8576-59d5f89e0e60/id-preview-17a1a466--436699f0-83c9-47ee-9158-29cbe4108f62.lovable.app-1776834127823.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Jost:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var raw=localStorage.getItem('cp-prefs-v1');if(raw){var t=JSON.parse(raw).state.theme;if(t)document.documentElement.setAttribute('data-theme',t);}}catch(e){}})();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <>
      <ThemeBootstrap />
      <Outlet />
    </>
  );
}
