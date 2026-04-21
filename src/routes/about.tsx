import { createFileRoute } from "@tanstack/react-router";
import { Heart, Leaf, MapPin, Phone, MessageCircle } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Clare Pastries" },
      { name: "description", content: "The story behind Clare Pastries — a homegrown artisan bakery in Busia, Kenya." },
    ],
  }),
});

function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="pt-32 pb-16 bg-[var(--cp-surface)]">
          <div className="container-cp max-w-3xl">
            <p className="label-eyebrow">Our Story</p>
            <h1 className="mt-3 font-display text-5xl md:text-6xl leading-[1.05]">The Story Behind Clare Pastries.</h1>
          </div>
        </section>

        <section className="py-20 container-cp max-w-3xl">
          <h2 className="font-display text-3xl">Who is Clare?</h2>
          <p className="mt-4 text-[var(--cp-text-muted)] leading-relaxed text-lg">
            Clare Pastries is a homegrown artisan bakery in the heart of Busia Town, Kenya. Every product is made to order — fresh, never frozen, never mass-produced. Just honest baking, done with love.
          </p>

          <div className="mt-14 grid md:grid-cols-3 gap-8">
            {[
              { Icon: Heart, t: "Made with Love", b: "Every item crafted by hand using the finest local ingredients." },
              { Icon: Leaf, t: "Fresh Daily", b: "We bake every morning. Nothing sits on a shelf overnight." },
              { Icon: MapPin, t: "Proudly Local", b: "Based in Busia Town, serving our community and beyond." },
            ].map((p) => (
              <div key={p.t}>
                <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-[var(--cp-surface)] border border-[var(--cp-border)] text-[var(--cp-accent)]">
                  <p.Icon size={20} />
                </div>
                <h3 className="mt-4 font-display text-xl">{p.t}</h3>
                <p className="mt-1.5 text-sm text-[var(--cp-text-muted)] leading-relaxed">{p.b}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-2xl bg-[var(--cp-cta)] text-[var(--cp-cta-text)]">
            <h3 className="font-display text-2xl">Come Find Us</h3>
            <p className="mt-2 opacity-85">Busia Town, Kenya</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <a href="tel:+254724848228" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--cp-cta-text)] text-[var(--cp-cta)] text-sm font-medium">
                <Phone size={14} /> Call Clare
              </a>
              <a href="https://wa.me/254724848228" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[var(--cp-cta-text)] text-[var(--cp-cta-text)] text-sm font-medium">
                <MessageCircle size={14} /> WhatsApp
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
