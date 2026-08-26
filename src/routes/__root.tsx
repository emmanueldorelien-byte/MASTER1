import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { LogIn, LogOut, User as UserIcon, Shield, Loader2 } from "lucide-react";
import { toast } from "sonner";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AuthDialog } from "@/components/AuthDialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-gradient-neon">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Paj la pa egziste</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Paj w ap chèche a pa la ankò oswa li deplase.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-display text-sm font-semibold text-neon-foreground [background-image:var(--gradient-neon)]"
          >
            Tounen akèy
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Paj sa a pa chaje</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Gen yon pwoblèm ki rive. Eseye rechaje oswa tounen sou paj akèy la.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 font-display text-sm font-semibold text-neon-foreground [background-image:var(--gradient-neon)]"
          >
            Eseye ankò
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-xl border border-border bg-transparent px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Tounen akèy
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "dark" },
      { name: "theme-color", content: "#0c0619" },
      { title: "Masterclass AI — Kreye Kontni & Fè Aplikasyon" },
      {
        name: "description",
        content:
          "Fòmasyon AI 100% gratis an kreyòl: kreye kontni, fè aplikasyon ak sètifika patisipasyon.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;900&family=Inter:wght@400;500;600;700&family=Cinzel:wght@500;600;700&display=swap",
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "alternate icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "apple-touch-icon", href: "/favicon.svg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="ht" className="dark">
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
  if (typeof window === 'undefined') return;
  window.__TSS_START_OPTIONS__ = window.__TSS_START_OPTIONS__ || {};
  var STORE_KEY = '__tanstack_als_store__';
  function defaultStore() {
    return { startOptions: window.__TSS_START_OPTIONS__ || {} };
  }
  function BPAsyncLocalStorage() { this[STORE_KEY] = defaultStore(); }
  BPAsyncLocalStorage.prototype.getStore = function () {
    var s = this[STORE_KEY];
    if (!s || typeof s !== 'object' || !('startOptions' in s)) { s = defaultStore(); this[STORE_KEY] = s; }
    return s;
  };
  BPAsyncLocalStorage.prototype.run = function (store, cb) {
    var prev = this[STORE_KEY]; this[STORE_KEY] = store || defaultStore();
    var args = Array.prototype.slice.call(arguments, 2); var res;
    try { res = cb.apply(null, args); }
    finally { if (!res || typeof res.then !== 'function') { this[STORE_KEY] = prev; } }
    if (res && typeof res.then === 'function') { var self = this; return res.then(function(v){ self[STORE_KEY] = prev; return v; }, function(e){ self[STORE_KEY] = prev; throw e; }); }
    return res;
  };
  BPAsyncLocalStorage.prototype.exit = function (cb) {
    var prev = this[STORE_KEY]; this[STORE_KEY] = defaultStore();
    var args = Array.prototype.slice.call(arguments, 1); var res;
    try { res = cb.apply(null, args); }
    finally { if (!res || typeof res.then !== 'function') { this[STORE_KEY] = prev; } }
    if (res && typeof res.then === 'function') { var self = this; return res.then(function(v){ self[STORE_KEY] = prev; return v; }, function(e){ self[STORE_KEY] = prev; throw e; }); }
    return res;
  };
  BPAsyncLocalStorage.prototype.enterWith = function (s) { this[STORE_KEY] = s || defaultStore(); };
  BPAsyncLocalStorage.prototype.disable = function () { this[STORE_KEY] = defaultStore(); };

  try { Object.defineProperty(globalThis, 'AsyncLocalStorage', { value: BPAsyncLocalStorage, writable: true, configurable: true }); } catch (e) { globalThis.AsyncLocalStorage = BPAsyncLocalStorage; }
  try { Object.defineProperty(window, 'AsyncLocalStorage', { value: BPAsyncLocalStorage, writable: true, configurable: true }); } catch (e) { window.AsyncLocalStorage = BPAsyncLocalStorage; }

  // Singleton store used by @tanstack/start-storage-context
  window.__tanstack_start_storage_singleton__ = new BPAsyncLocalStorage();
})();`,
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

const navItems = [
  { to: "/", label: "Akèy" },
  { to: "/live", label: "Live & Resous" },
  { to: "/asistans", label: "Asistans" },
  { to: "/sertifika", label: "Sètifika" },
  { to: "/verify", label: "Verifye" },
] as const;

function AuthButton() {
  const { user, loading, isAdmin, logout } = useAuth();
  const [authOpen, setAuthOpen] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const router = useRouter();

  if (loading) {
    return (
      <Button variant="outlineNeon" size="sm" disabled>
        <Loader2 className="animate-spin" />
      </Button>
    );
  }

  if (!user) {
    return (
      <>
        <Button
          variant="neon"
          size="sm"
          onClick={() => setAuthOpen(true)}
          className="sm:px-4"
        >
          <LogIn className="size-4" />
          <span>Konekte</span>
        </Button>
        <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="login" />
      </>
    );
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outlineNeon" size="sm" className="sm:px-4 gap-2">
            <div className="grid size-6 place-items-center rounded-full bg-accent/20 text-accent">
              {isAdmin ? (
                <Shield className="size-3.5" />
              ) : (
                <UserIcon className="size-3.5" />
              )}
            </div>
            <span className="hidden sm:inline max-w-[120px] truncate">
              {user.full_name ?? user.email ?? "Kont"}
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass w-64 rounded-2xl border-border/80 p-2">
          <DropdownMenuLabel className="font-display text-sm text-foreground">
            {isAdmin ? (
              <span className="inline-flex items-center gap-2">
                <Shield className="size-4 text-accent" />
                Kont Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <UserIcon className="size-4 text-accent" />
                Kont Elèv
              </span>
            )}
          </DropdownMenuLabel>
          <div className="px-2 pb-2">
            <p className="text-xs text-muted-foreground truncate">
              {user.email ?? ""}
            </p>
            {user.full_name && (
              <p className="text-xs text-muted-foreground truncate">
                {user.full_name}
              </p>
            )}
          </div>
          <DropdownMenuSeparator />
          {isAdmin && (
            <DropdownMenuItem asChild>
              <Link
                to="/admin"
                className="cursor-pointer rounded-xl text-sm font-semibold text-accent hover:bg-accent/10"
              >
                <Shield className="size-4" />
                Panèl Admin
              </Link>
            </DropdownMenuItem>
          )}
          {!isAdmin && (
            <DropdownMenuItem disabled className="rounded-xl text-xs text-muted-foreground">
              <Shield className="size-4 opacity-50" />
              Se sèlman admin ki gen aksè panèl la
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer rounded-xl text-sm font-semibold text-destructive hover:bg-destructive/10 focus:text-destructive"
            onClick={async () => {
              setLogoutLoading(true);
              try {
                await logout();
                toast.success("Ou dekonekte avèk siksè.");
                if (router.state.location.pathname === "/admin") {
                  await router.navigate({ to: "/" });
                }
              } catch (err) {
                const msg = err instanceof Error ? err.message : "Dekoneksyon an echwe.";
                toast.error(msg);
              } finally {
                setLogoutLoading(false);
              }
            }}
          >
            {logoutLoading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Dekonekte
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/70 [background-color:color-mix(in_oklch,var(--color-background)_75%,transparent)] [-webkit-backdrop-filter:blur(24px)_saturate(130%)] [backdrop-filter:blur(24px)_saturate(130%)]">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="font-display text-sm font-bold tracking-wide sm:text-base">
            MASTERCLASS <span className="text-gradient-neon">AI</span>
          </span>
        </Link>
        <nav className="flex items-center gap-1 sm:gap-2">
          {navItems.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className="rounded-lg px-2.5 py-2 text-xs font-semibold tracking-wide text-muted-foreground transition-colors hover:text-foreground data-[status=active]:text-accent sm:px-3 sm:text-sm"
            >
              {item.label}
            </Link>
          ))}
          <div className="ml-1">
            <AuthButton />
          </div>
        </nav>
      </div>
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-border/70 py-8">
      <div className="mx-auto max-w-6xl px-4 text-center text-xs text-muted-foreground">
        <p className="font-display tracking-wide" style={{ fontSize: 0 }}>
          <span id="site-name" style={{ fontSize: "0.75rem" }}>
            MASTERCLASS AI
          </span>
        </p>
        <p className="mt-2">Fòmasyon an kreyòl pou tout moun. 100% gratis, 100% online.</p>
        <p className="mt-3 flex items-center justify-center gap-2">
          <span className="opacity-70">Kontak:</span>
          <a
            href="mailto:relaxmy89@gmail.com"
            className="font-semibold text-accent transition-colors hover:text-accent/80"
          >
            relaxmy89@gmail.com
          </a>
        </p>
      </div>
    </footer>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  useEffect(() => {
    try {
      const el = document.querySelector("footer .font-display");
      if (el) el.textContent = "MASTERCLASS AI";
    } catch (e) {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const p = document.querySelector("footer .font-display");
      if (p) {
        const span = p.querySelector("#site-name");
        if (span) span.textContent = "MASTERCLASS AI";
        else p.textContent = "MASTERCLASS AI";

        const mo = new MutationObserver(() => {
          const s = p.querySelector("#site-name");
          if (!s) {
            p.innerHTML = '<span id="site-name">MASTERCLASS AI</span>';
          } else if (s.textContent !== "MASTERCLASS AI") {
            s.textContent = "MASTERCLASS AI";
          }
        });
        mo.observe(p, { childList: true, characterData: true, subtree: true });
      }
    } catch (e) {
      /* ignore */
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="flex min-h-screen flex-col">
          <SiteHeader />
          <main className="flex-1">
            {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
            <Outlet />
          </main>
          <SiteFooter />
        </div>
        <Toaster
          position="top-center"
          theme="dark"
          richColors
          closeButton={false}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
