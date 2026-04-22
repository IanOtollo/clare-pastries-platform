import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ShoppingBag, UserCircle2, Sun, Moon, Menu as MenuIcon, X, Phone, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { WheatMark } from "@/components/brand/WheatMark";
import { useCart } from "@/lib/cart";
import { usePrefs } from "@/lib/preferences";

const NAV = [
  { to: "/", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/gallery", label: "Gallery" },
  { to: "/contact", label: "Contact" },
] as const;

export function Navbar({ transparentTop = false }: { transparentTop?: boolean }) {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { currency, setCurrency, theme, setTheme } = usePrefs();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showSolid = !transparentTop || scrolled;

  return (
    <>
      <header
        className={[
          "fixed top-0 inset-x-0 z-50 transition-all duration-300",
          showSolid
            ? "backdrop-blur-md bg-[color-mix(in_oklab,var(--cp-bg)_82%,transparent)] border-b border-[var(--cp-border)]"
            : "bg-transparent",
        ].join(" ")}
      >
        <div className="container-cp flex items-center justify-between h-16 md:h-20">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="Clare Pastries home">
            <WheatMark className={["h-8 w-8 transition-colors", showSolid ? "text-[var(--cp-accent)]" : "text-white"].join(" ")} />
            <span
              className={[
                "font-display text-xl md:text-2xl font-medium tracking-tight hidden sm:inline transition-colors",
                showSolid ? "text-[var(--cp-text)]" : "text-white",
              ].join(" ")}
            >
              Clare Pastries
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className={[
                  "text-sm font-medium tracking-wide transition-colors",
                  showSolid ? "text-[var(--cp-text)] hover:text-[var(--cp-accent)]" : "text-white/90 hover:text-white",
                ].join(" ")}
                activeProps={{ className: "text-[var(--cp-accent)]" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1.5 md:gap-2">
            <div
              className={[
                "hidden md:inline-flex items-center rounded-full p-0.5 text-xs font-mono",
                showSolid ? "bg-[var(--cp-surface-2)]" : "bg-white/15 backdrop-blur",
              ].join(" ")}
            >
              {(["KES", "UGX"] as const).map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={[
                    "px-2.5 py-1 rounded-full transition-all",
                    currency === c
                      ? "bg-[var(--cp-accent)] text-[#1A1410]"
                      : showSolid
                      ? "text-[var(--cp-text-muted)]"
                      : "text-white/80",
                  ].join(" ")}
                >
                  {c}
                </button>
              ))}
            </div>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              aria-label="Toggle theme"
              className={[
                "hidden md:inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors",
                showSolid ? "hover:bg-[var(--cp-surface-2)] text-[var(--cp-text)]" : "hover:bg-white/15 text-white",
              ].join(" ")}
            >
              {theme === "dark" ? <Sun className="h-4.5 w-4.5" size={18} /> : <Moon size={18} />}
            </button>

            <Link
              to="/cart"
              aria-label="Cart"
              className={[
                "relative inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors",
                showSolid ? "hover:bg-[var(--cp-surface-2)] text-[var(--cp-text)]" : "hover:bg-white/15 text-white",
              ].join(" ")}
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--cp-accent)] text-[#1A1410] text-[10px] font-mono font-medium flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>

            <Link
              to="/account"
              aria-label="Account / Sign in"
              className={[
                "inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors",
                showSolid ? "hover:bg-[var(--cp-surface-2)] text-[var(--cp-text)]" : "hover:bg-white/15 text-white",
              ].join(" ")}
            >
              <UserCircle2 size={18} />
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
              className={[
                "md:hidden inline-flex items-center justify-center h-9 w-9 rounded-full transition-colors",
                showSolid ? "hover:bg-[var(--cp-surface-2)] text-[var(--cp-text)]" : "hover:bg-white/15 text-white",
              ].join(" ")}
            >
              <MenuIcon size={20} />
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
            className="fixed inset-0 z-[60] bg-[var(--cp-bg)] flex flex-col"
          >
            <div className="flex items-center justify-between h-16 px-5 border-b border-[var(--cp-border)]">
              <div className="flex items-center gap-2">
                <WheatMark className="h-7 w-7 text-[var(--cp-accent)]" />
                <span className="font-display text-xl">Clare Pastries</span>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
                className="h-9 w-9 rounded-full inline-flex items-center justify-center hover:bg-[var(--cp-surface-2)]"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-5 py-8 space-y-1">
              {[
                ...NAV,
                { to: "/account", label: "Sign in / Account" },
                { to: "/menu", label: "Track My Order" },
                { to: "/menu#custom-order", label: "Custom Order" },
              ].map((n, i) => (
                <Link
                  key={`${n.to}-${i}`}
                  to={n.to}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-2xl font-display text-[var(--cp-text)] hover:text-[var(--cp-accent)] transition-colors"
                >
                  {n.label}
                </Link>
              ))}

              <div className="pt-6 mt-6 border-t border-[var(--cp-border)] space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono uppercase tracking-wider text-[var(--cp-text-muted)]">Currency</span>
                  <div className="inline-flex items-center rounded-full p-0.5 bg-[var(--cp-surface-2)] text-xs font-mono">
                    {(["KES", "UGX"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCurrency(c)}
                        className={[
                          "px-3 py-1 rounded-full",
                          currency === c ? "bg-[var(--cp-accent)] text-[#1A1410]" : "text-[var(--cp-text-muted)]",
                        ].join(" ")}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-mono uppercase tracking-wider text-[var(--cp-text-muted)]">Theme</span>
                  <button
                    onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--cp-surface-2)] text-sm"
                  >
                    {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
                    {theme === "dark" ? "Light" : "Dark"}
                  </button>
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-[var(--cp-border)] space-y-3">
                <a href="tel:+254724848228" className="flex items-center gap-3 py-2 text-[var(--cp-text)]">
                  <Phone size={18} className="text-[var(--cp-accent)]" />
                  <span className="font-mono">+254 724 848228</span>
                </a>
                <a
                  href="https://wa.me/254724848228"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 py-2 text-[var(--cp-text)]"
                >
                  <MessageCircle size={18} className="text-[var(--cp-accent)]" />
                  WhatsApp Clare
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
