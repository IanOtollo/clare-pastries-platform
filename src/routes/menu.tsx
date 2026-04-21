import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search, Wheat } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, type ProductCardProduct } from "@/components/product/ProductCard";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = ["All", "Cakes", "Pastries", "Breads", "Seasonal"] as const;
type Cat = (typeof CATEGORIES)[number];
type Sort = "featured" | "price-asc" | "price-desc";

export const Route = createFileRoute("/menu")({
  component: MenuPage,
  head: () => ({
    meta: [
      { title: "The Menu — Clare Pastries" },
      { name: "description", content: "Browse Clare's daily selection of artisan cakes, pastries and breads, all baked fresh in Busia." },
    ],
  }),
});

function MenuPage() {
  const [products, setProducts] = useState<(ProductCardProduct & { featured: boolean })[] | null>(null);
  const [cat, setCat] = useState<Cat>("All");
  const [sort, setSort] = useState<Sort>("featured");
  const [q, setQ] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase
      .from("products")
      .select("id,name,slug,category,short_description,price_kes,image_url,available,featured")
      .order("created_at", { ascending: false })
      .then(({ data }) => { if (mounted) setProducts(data ?? []); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!products) return null;
    let out = products.filter((p) => (cat === "All" ? true : p.category === cat));
    if (q.trim()) {
      const needle = q.toLowerCase();
      out = out.filter((p) => p.name.toLowerCase().includes(needle) || p.short_description.toLowerCase().includes(needle));
    }
    if (sort === "price-asc") out = [...out].sort((a, b) => a.price_kes - b.price_kes);
    else if (sort === "price-desc") out = [...out].sort((a, b) => b.price_kes - a.price_kes);
    else out = [...out].sort((a, b) => Number(b.featured) - Number(a.featured));
    out = [...out].sort((a, b) => Number(b.available) - Number(a.available));
    return out;
  }, [products, cat, sort, q]);

  return (
    <>
      <Navbar />
      <main className="pt-28 md:pt-32 pb-24">
        <div className="container-cp">
          <div className="max-w-2xl">
            <p className="label-eyebrow">The Bakeshop</p>
            <h1 className="mt-3 font-display text-5xl md:text-6xl text-[var(--cp-text)]">The Menu.</h1>
            <p className="mt-4 text-[var(--cp-text-muted)] text-lg">
              Handcrafted daily in Busia with the finest local ingredients.
            </p>
          </div>

          <div className="mt-10 sticky top-16 md:top-20 z-30 bg-[var(--cp-bg)]/85 backdrop-blur-md -mx-5 md:-mx-8 px-5 md:px-8 py-4 border-y border-[var(--cp-border)]">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap flex-1">
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    className={[
                      "px-3.5 py-1.5 rounded-full text-sm transition-colors border",
                      cat === c
                        ? "bg-[var(--cp-cta)] text-[var(--cp-cta-text)] border-[var(--cp-cta)]"
                        : "border-[var(--cp-border)] text-[var(--cp-text-muted)] hover:text-[var(--cp-text)]",
                    ].join(" ")}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--cp-text-muted)]" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search bakes…"
                  className="pl-9 pr-3 py-1.5 rounded-full bg-[var(--cp-surface)] border border-[var(--cp-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]"
                />
              </div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="px-3 py-1.5 rounded-full bg-[var(--cp-surface)] border border-[var(--cp-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low → High</option>
                <option value="price-desc">Price: High → Low</option>
              </select>
            </div>
            <p className="mt-2.5 font-mono text-[11px] uppercase tracking-wider text-[var(--cp-text-muted)]">
              {filtered ? `Showing ${filtered.length} item${filtered.length === 1 ? "" : "s"}` : "Loading…"}
            </p>
          </div>

          <div className="mt-10">
            {filtered === null ? (
              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="cp-card overflow-hidden">
                    <div className="aspect-[16/10] bg-[var(--cp-surface-2)] animate-pulse" />
                    <div className="p-5 space-y-3">
                      <div className="h-5 w-2/3 bg-[var(--cp-surface-2)] rounded animate-pulse" />
                      <div className="h-9 w-full bg-[var(--cp-surface-2)] rounded animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20">
                <Wheat className="mx-auto text-[var(--cp-text-muted)]" size={64} />
                <p className="mt-5 font-display text-2xl">Nothing matches your search.</p>
                <p className="mt-2 text-[var(--cp-text-muted)]">Try a different category or keyword.</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
                {filtered.map((p, i) => (
                  <div key={p.id} className={p.available ? "" : "opacity-60"}>
                    <ProductCard product={p} index={i} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <CustomOrderSection />
        </div>
      </main>
      <Footer />
    </>
  );
}

function CustomOrderSection() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <section id="custom-order" className="mt-32 scroll-mt-32">
      <div className="cp-card p-8 md:p-12 max-w-3xl mx-auto !shadow-lg">
        <p className="label-eyebrow">Bespoke</p>
        <h2 className="mt-3 font-display text-3xl md:text-4xl">Order Something Made Just for You</h2>
        <p className="mt-3 text-[var(--cp-text-muted)]">
          From wedding cakes to themed birthday pastries — describe your vision and Clare will get back to you within 24 hours.
        </p>

        {submitted ? (
          <div className="mt-8 p-6 rounded-lg bg-[var(--cp-success)]/10 border border-[var(--cp-success)]/30 text-center">
            <p className="font-display text-2xl text-[var(--cp-success)]">Clare received your request!</p>
            <p className="mt-2 text-[var(--cp-text-muted)]">She'll reach out within 24 hours on +254 724 848228.</p>
          </div>
        ) : (
          <form
            onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
            className="mt-8 grid md:grid-cols-2 gap-5"
          >
            <Field label="Full Name" required><input required className={input} /></Field>
            <Field label="Phone" required><input required className={input} placeholder="+254…" /></Field>
            <Field label="Email"><input type="email" className={input} /></Field>
            <Field label="Occasion" required>
              <select required className={input}>
                <option value="">Select…</option>
                <option>Birthday</option><option>Wedding</option><option>Anniversary</option>
                <option>Office Event</option><option>Religious Celebration</option><option>Other</option>
              </select>
            </Field>
            <Field label="What would you like?" required full>
              <textarea required rows={4} className={input} placeholder="e.g. A 3-tier vanilla sponge with fondant roses and gold leaf…" />
            </Field>
            <Field label="Servings"><input type="number" min={1} className={input} /></Field>
            <Field label="Preferred Date"><input type="date" className={input} /></Field>
            <Field label="Budget Range">
              <select className={input}>
                <option>Under KES 1,000</option><option>KES 1,000 – 3,000</option>
                <option>KES 3,000 – 8,000</option><option>KES 8,000+</option><option>Not sure</option>
              </select>
            </Field>
            <Field label="Fulfillment">
              <select className={input}><option>Delivery</option><option>Pickup</option></select>
            </Field>
            <div className="md:col-span-2 mt-2">
              <button type="submit" className="btn-cta w-full md:w-auto">Send My Request to Clare →</button>
            </div>
          </form>
        )}

        <div className="mt-8 pt-6 border-t border-[var(--cp-border)] text-sm text-[var(--cp-text-muted)]">
          Prefer to chat directly?{" "}
          <a href="https://wa.me/254724848228" target="_blank" rel="noreferrer" className="text-[var(--cp-accent)] hover:underline font-medium">
            WhatsApp Clare →
          </a>
        </div>
      </div>
    </section>
  );
}

const input = "w-full px-3.5 py-2.5 rounded-lg bg-[var(--cp-bg)] border border-[var(--cp-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)] focus:border-transparent";

function Field({ label, required, children, full }: { label: string; required?: boolean; children: React.ReactNode; full?: boolean }) {
  return (
    <label className={["block", full ? "md:col-span-2" : ""].join(" ")}>
      <span className="block text-xs font-mono uppercase tracking-wider text-[var(--cp-text-muted)] mb-1.5">
        {label} {required && <span className="text-[var(--cp-accent)]">*</span>}
      </span>
      {children}
    </label>
  );
}
