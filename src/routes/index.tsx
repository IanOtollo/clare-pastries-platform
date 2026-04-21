import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, createFileRoute } from "@tanstack/react-router";
import {
  MapPin, Clock, Smartphone, Flame, Truck, Phone,
  Search, ShoppingCart, ChefHat, Wheat,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ProductCard, type ProductCardProduct } from "@/components/product/ProductCard";
import { detectSeason } from "@/lib/seasonal";
import { usePrefs } from "@/lib/preferences";
import { supabase } from "@/integrations/supabase/client";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=1920&q=85",
  "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1920&q=85",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1920&q=85",
  "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1920&q=85",
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1920&q=85",
];

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <>
      <Navbar transparentTop />
      <main>
        <Hero />
        <TrustBar />
        <StoryStrip />
        <FeaturedBakes />
        <HowItWorks />
        <CustomTeaser />
        <FinalCTA />
      </main>
      <Footer />
    </>
  );
}

function Hero() {
  const [idx, setIdx] = useState(0);
  const visitCount = usePrefs((s) => s.visitCount);
  const consent = usePrefs((s) => s.cookieConsent);
  const season = useMemo(() => detectSeason(), []);

  // Preload all 5 hero images
  useEffect(() => {
    HERO_IMAGES.forEach((src) => { const img = new Image(); img.src = src; });
  }, []);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % HERO_IMAGES.length), 5000);
    return () => clearInterval(t);
  }, []);

  const ctaLabel = useMemo(() => {
    if (consent === "accepted" && visitCount >= 2) {
      const opts = ["Back for Another Bite?", "Clare Missed You. Let's Bake.", "Your Usual? Let's Go.", "Welcome Back — Something Fresh Awaits"];
      return opts[Math.floor(Math.random() * opts.length)];
    }
    return "Order Your First Pastry from Clare";
  }, [consent, visitCount]);

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden">
      <div className="absolute inset-0">
        <AnimatePresence>
          <motion.div
            key={idx}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="absolute inset-0"
            style={{
              backgroundImage: `url(${HERO_IMAGES[idx]})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1A1410]/75 via-[#1A1410]/45 to-[#1A1410]/20 md:from-[#1A1410]/65 md:via-[#1A1410]/30 md:to-transparent" />
      </div>

      <div className="container-cp relative z-10 pt-24 pb-32 md:pt-28">
        <div className="max-w-3xl text-white">
          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0, duration: 0.6 }}
            className="font-mono text-[11px] md:text-xs uppercase tracking-[0.2em] text-[var(--cp-accent)]"
          >
            {season.heroLabel}
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7 }}
            className="mt-5 font-display font-medium leading-[0.95] tracking-tight"
            style={{ fontSize: "clamp(2.75rem, 8vw, 6.5rem)" }}
          >
            Every Bite,<br />a Celebration.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-6 max-w-xl text-base md:text-lg font-light text-white/85 leading-relaxed"
          >
            Freshly baked pastries, cakes, and more — handcrafted by Clare in Busia, delivered to your door.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Link to="/menu" className="btn-accent pulse-once">
              <Wheat size={18} />
              {ctaLabel} →
            </Link>
            <Link to="/menu" className="text-white/90 hover:text-white text-sm font-medium underline-offset-4 hover:underline">
              Browse the Menu →
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            className="mt-10 flex flex-wrap gap-2.5"
          >
            <Pill icon={<MapPin size={14} />}>Busia Town, Kenya</Pill>
            <Pill icon={<Clock size={14} />}>45–90 min Delivery</Pill>
            <Pill icon={<Smartphone size={14} />}>M-Pesa Accepted</Pill>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-7 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {HERO_IMAGES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={[
              "h-1.5 rounded-full transition-all",
              i === idx ? "w-8 bg-[var(--cp-accent)]" : "w-1.5 bg-white/50 hover:bg-white/80",
            ].join(" ")}
          />
        ))}
      </div>
    </section>
  );
}

function Pill({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium text-white">
      <span className="text-[var(--cp-accent)]">{icon}</span>
      {children}
    </span>
  );
}

function TrustBar() {
  const items = [
    { icon: Flame, label: "Baked Fresh Daily" },
    { icon: Truck, label: "Delivered in Busia Town" },
    { icon: Smartphone, label: "Pay via M-Pesa" },
    { icon: Phone, label: "+254 724 848228", href: "tel:+254724848228" },
  ];
  return (
    <section className="border-y border-[var(--cp-border)] bg-[var(--cp-surface)]">
      <div className="container-cp">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[var(--cp-border)] md:divide-x">
          {items.map((it, i) => {
            const Icon = it.icon;
            const inner = (
              <div className="flex items-center justify-center gap-3 py-5 px-4 text-center">
                <Icon size={18} className="text-[var(--cp-accent)] shrink-0" />
                <span className="text-sm font-medium text-[var(--cp-text)]">{it.label}</span>
              </div>
            );
            return it.href ? (
              <a key={i} href={it.href} className="hover:bg-[var(--cp-surface-2)] transition-colors">{inner}</a>
            ) : (
              <div key={i}>{inner}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function StoryStrip() {
  const frames = [
    { Icon: Wheat, title: "The Finest Ingredients", body: "Every bake starts with carefully selected local ingredients — flour, fresh eggs, real butter, and Clare's secret touch." },
    { Icon: ChefHat, title: "Crafted by Hand", body: "No shortcuts. No machines doing the work. Every loaf, every layer, every swirl of frosting is shaped by Clare herself." },
    { Icon: Truck, title: "Fresh to Your Door", body: "Warm, fragrant, and made that morning. From our oven in Busia Town to your table — within 45 to 90 minutes." },
  ];
  return (
    <section className="py-24 md:py-32">
      <div className="container-cp">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="label-eyebrow">The Craft</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-[var(--cp-text)]">From Our Hands to Your Table.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-12 md:gap-8 relative">
          {frames.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="text-center px-2 relative"
            >
              <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-[var(--cp-surface)] border border-[var(--cp-border)] text-[var(--cp-accent)] mb-6">
                <f.Icon size={32} />
              </div>
              <h3 className="font-display text-2xl text-[var(--cp-text)] mb-3">{f.title}</h3>
              <p className="text-[var(--cp-text-muted)] leading-relaxed max-w-xs mx-auto">{f.body}</p>
              {i < frames.length - 1 && (
                <div className="hidden md:block absolute top-10 -right-4 w-8 border-t border-dashed border-[var(--cp-border)]" />
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedBakes() {
  const [products, setProducts] = useState<ProductCardProduct[] | null>(null);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("products")
      .select("id,name,slug,category,short_description,price_kes,image_url,available")
      .eq("available", true)
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => { if (mounted) setProducts(data ?? []); });
    return () => { mounted = false; };
  }, []);

  return (
    <section className="py-24 md:py-32 bg-[var(--cp-surface)]">
      <div className="container-cp">
        <div className="flex items-end justify-between gap-6 mb-12 flex-wrap">
          <div>
            <p className="label-eyebrow">From the Oven</p>
            <h2 className="mt-3 font-display text-4xl md:text-5xl text-[var(--cp-text)]">Our Most Loved Bakes</h2>
          </div>
          <Link to="/menu" className="text-sm font-medium text-[var(--cp-text)] hover:text-[var(--cp-accent)] underline-offset-4 hover:underline">
            See Full Menu →
          </Link>
        </div>

        {products === null ? (
          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="cp-card overflow-hidden">
                <div className="aspect-[16/10] bg-[var(--cp-surface-2)] animate-pulse" />
                <div className="p-5 space-y-3">
                  <div className="h-5 w-2/3 bg-[var(--cp-surface-2)] rounded animate-pulse" />
                  <div className="h-4 w-full bg-[var(--cp-surface-2)] rounded animate-pulse" />
                  <div className="h-9 w-full bg-[var(--cp-surface-2)] rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Wheat className="mx-auto text-[var(--cp-text-muted)]" size={64} />
            <p className="mt-5 font-display text-2xl text-[var(--cp-text)]">Clare is warming up the oven.</p>
            <p className="mt-2 text-[var(--cp-text-muted)]">Our menu will be ready very soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-6">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { Icon: Search, title: "Browse & Choose", body: "Explore Clare's daily selection of artisan pastries, custom cakes, and fresh breads." },
    { Icon: ShoppingCart, title: "Place Your Order", body: "Quick checkout with M-Pesa or card. Choose delivery or pickup from our kitchen." },
    { Icon: ChefHat, title: "Clare Gets Baking", body: "Your order goes straight to Clare. Fresh bakes delivered within 45–90 minutes." },
  ];
  return (
    <section className="py-24 md:py-32">
      <div className="container-cp">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="label-eyebrow">How It Works</p>
          <h2 className="mt-3 font-display text-4xl md:text-5xl text-[var(--cp-text)]">Three Simple Steps.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10 md:gap-8">
          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15 }}
              className="relative px-2"
            >
              <span
                aria-hidden
                className="absolute -top-4 left-2 font-display text-[5rem] leading-none text-[var(--cp-accent)] opacity-[0.12] select-none pointer-events-none"
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="relative inline-flex items-center justify-center h-14 w-14 rounded-full bg-[var(--cp-cta)] text-[var(--cp-cta-text)] mb-5">
                <s.Icon size={22} />
              </div>
              <h3 className="font-display text-2xl text-[var(--cp-text)] mb-2 relative">{s.title}</h3>
              <p className="text-[var(--cp-text-muted)] leading-relaxed relative">{s.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CustomTeaser() {
  return (
    <section className="bg-[var(--cp-cta)] text-[var(--cp-cta-text)] py-24 md:py-28">
      <div className="container-cp text-center max-w-2xl">
        <h2 className="font-display text-4xl md:text-5xl">Something Unique in Mind?</h2>
        <p className="mt-5 text-base md:text-lg opacity-85 leading-relaxed">
          Wedding cake? Birthday surprise? Office treats? Tell Clare exactly what you want and she'll make it happen.
        </p>
        <div className="mt-9">
          <Link to="/menu" hash="custom-order" className="btn-outline-light">
            Start a Custom Order →
          </Link>
        </div>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-24 md:py-32 bg-gradient-to-br from-[var(--cp-surface)] via-[var(--cp-bg)] to-[var(--cp-surface-2)]">
      <div className="container-cp text-center max-w-2xl">
        <p className="label-eyebrow">Order Now</p>
        <h2 className="mt-3 font-display text-4xl md:text-6xl text-[var(--cp-text)]">Ready to Taste Clare's Best?</h2>
        <p className="mt-5 text-[var(--cp-text-muted)] text-lg leading-relaxed">
          Order now and have fresh pastries at your door in under 90 minutes.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-5">
          <Link to="/menu" className="btn-cta">Order Now →</Link>
          <a href="tel:+254724848228" className="text-[var(--cp-text)] font-medium hover:text-[var(--cp-accent)] inline-flex items-center gap-2">
            <Phone size={16} /> +254 724 848228
          </a>
        </div>
      </div>
    </section>
  );
}
