import { Link } from "@tanstack/react-router";
import { Phone, MessageCircle, Sun, Moon } from "lucide-react";
import { WheatMark } from "@/components/brand/WheatMark";
import { usePrefs } from "@/lib/preferences";

export function Footer() {
  const { theme, setTheme } = usePrefs();
  return (
    <footer className="bg-[var(--cp-surface)] border-t border-[var(--cp-border)] mt-24">
      <div className="container-cp py-14 grid gap-10 md:grid-cols-3">
        <div>
          <div className="flex items-center gap-2.5">
            <WheatMark className="h-7 w-7 text-[var(--cp-accent)]" />
            <span className="font-display text-xl">Clare Pastries</span>
          </div>
          <p className="mt-4 text-[var(--cp-text-muted)] max-w-xs">Baked Fresh. Delivered with Love.</p>
          <p className="mt-2 text-sm text-[var(--cp-text-muted)]">Busia Town, Kenya</p>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="mt-5 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--cp-surface-2)] text-sm border border-[var(--cp-border)]"
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
        </div>

        <div>
          <p className="label-eyebrow mb-4">Quick Links</p>
          <ul className="space-y-2.5 text-sm">
            <li><Link to="/" className="hover:text-[var(--cp-accent)]">Home</Link></li>
            <li><Link to="/menu" className="hover:text-[var(--cp-accent)]">Menu</Link></li>
            <li><Link to="/gallery" className="hover:text-[var(--cp-accent)]">Gallery</Link></li>
            <li><Link to="/about" className="hover:text-[var(--cp-accent)]">About</Link></li>
            <li><Link to="/contact" className="hover:text-[var(--cp-accent)]">Contact</Link></li>
          </ul>
        </div>

        <div>
          <p className="label-eyebrow mb-4">Reach Clare</p>
          <a href="tel:+254724848228" className="flex items-center gap-2 text-sm hover:text-[var(--cp-accent)]">
            <Phone size={14} /> <span className="font-mono">+254 724 848228</span>
          </a>
          <a
            href="https://wa.me/254724848228"
            target="_blank"
            rel="noreferrer"
            className="mt-2 flex items-center gap-2 text-sm hover:text-[var(--cp-accent)]"
          >
            <MessageCircle size={14} /> WhatsApp Clare
          </a>
          <p className="mt-6 text-xs font-mono uppercase tracking-wider text-[var(--cp-text-muted)]">We Accept</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2.5 py-1 rounded bg-[var(--cp-surface-2)] text-xs font-mono">M-PESA</span>
            <span className="px-2.5 py-1 rounded bg-[var(--cp-surface-2)] text-xs font-mono">CARD</span>
            <span className="px-2.5 py-1 rounded bg-[var(--cp-surface-2)] text-xs font-mono">CASH</span>
          </div>
        </div>
      </div>
      <div className="border-t border-[var(--cp-border)]">
        <div className="container-cp py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[var(--cp-text-muted)]">
          <span>© {new Date().getFullYear()} Clare Pastries. All rights reserved.</span>
          <span>Handcrafted by IanOtollo at IOMTechs</span>
        </div>
      </div>
    </footer>
  );
}
