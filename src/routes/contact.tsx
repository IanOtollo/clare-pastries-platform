import { createFileRoute, Link } from "@tanstack/react-router";
import { Phone, MessageCircle, ShoppingBag, MapPin } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/contact")({
  component: ContactPage,
  head: () => ({
    meta: [
      { title: "Contact — Clare Pastries" },
      { name: "description", content: "Talk to Clare directly. Call or WhatsApp +254 724 848228." },
    ],
  }),
});

function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24 container-cp">
        <div className="max-w-2xl">
          <p className="label-eyebrow">Get in Touch</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Let's Talk Pastries.</h1>
          <p className="mt-4 text-[var(--cp-text-muted)] text-lg">
            Clare will get back to you as soon as possible.
          </p>
        </div>

        <div className="mt-12 grid md:grid-cols-2 gap-6 max-w-3xl">
          <div className="cp-card !p-7">
            <Phone className="text-[var(--cp-accent)]" size={24} />
            <h2 className="mt-4 font-display text-2xl">Call or WhatsApp Clare</h2>
            <p className="mt-1 font-mono text-lg">+254 724 848228</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <a href="tel:+254724848228" className="btn-cta text-sm py-2.5">Call Now</a>
              <a href="https://wa.me/254724848228" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[var(--cp-border)] text-sm hover:border-[var(--cp-accent)]">
                <MessageCircle size={16} /> WhatsApp
              </a>
            </div>
          </div>

          <div className="cp-card !p-7">
            <ShoppingBag className="text-[var(--cp-accent)]" size={24} />
            <h2 className="mt-4 font-display text-2xl">Ready to Order?</h2>
            <p className="mt-1 text-[var(--cp-text-muted)] text-sm">Browse our menu and place your order directly online.</p>
            <Link to="/menu" className="btn-cta mt-5 inline-flex text-sm py-2.5">Browse Menu →</Link>
          </div>

          <div className="cp-card !p-7 md:col-span-2">
            <MapPin className="text-[var(--cp-accent)]" size={24} />
            <h2 className="mt-4 font-display text-2xl">Find Clare</h2>
            <p className="mt-1 text-[var(--cp-text-muted)]">Busia Town, Kenya</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
