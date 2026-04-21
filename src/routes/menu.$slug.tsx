import { useEffect, useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, MessageCircle, ShoppingCart, Wheat } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart";
import { usePrefs } from "@/lib/preferences";
import { formatKES, formatUGX } from "@/lib/format";

export const Route = createFileRoute("/menu/$slug")({ component: ProductDetail });

interface Product {
  id: string; name: string; slug: string; category: string;
  short_description: string; description: string;
  ingredients: string[]; allergens: string[];
  price_kes: number; image_url: string | null; available: boolean;
}

function ProductDetail() {
  const { slug } = Route.useParams();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [qty, setQty] = useState(1);
  const add = useCart((s) => s.add);
  const currency = usePrefs((s) => s.currency);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("products")
      .select("id,name,slug,category,short_description,description,ingredients,allergens,price_kes,image_url,available")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => { if (mounted) setProduct(data as Product | null); });
    return () => { mounted = false; };
  }, [slug]);

  if (product === undefined) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-24 container-cp">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-square bg-[var(--cp-surface-2)] rounded-2xl animate-pulse" />
            <div className="space-y-4">
              <div className="h-6 w-1/3 bg-[var(--cp-surface-2)] rounded animate-pulse" />
              <div className="h-12 w-3/4 bg-[var(--cp-surface-2)] rounded animate-pulse" />
              <div className="h-24 w-full bg-[var(--cp-surface-2)] rounded animate-pulse" />
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }
  if (!product) throw notFound();

  return (
    <>
      <Navbar />
      <main className="pt-24 md:pt-28 pb-24">
        <div className="container-cp">
          <Link to="/menu" className="inline-flex items-center gap-1 text-sm text-[var(--cp-text-muted)] hover:text-[var(--cp-accent)] mb-6">
            <ChevronLeft size={16} /> Back to menu
          </Link>

          <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-[var(--cp-surface-2)] border border-[var(--cp-border)]">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center"><Wheat className="text-[var(--cp-border)]" size={80} /></div>
              )}
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-wider text-[var(--cp-text-muted)]">
                Menu / {product.category}
              </p>
              <h1 className="mt-2 font-display text-4xl md:text-5xl">{product.name}</h1>
              <div className="mt-4 flex items-baseline gap-3">
                <span className="font-mono text-2xl text-[var(--cp-accent)] font-medium">{formatKES(product.price_kes)}</span>
                {currency === "KES" && (
                  <span className="font-mono text-sm text-[var(--cp-text-muted)]">≈ {formatUGX(product.price_kes)}</span>
                )}
              </div>
              <p className="mt-6 text-[var(--cp-text-muted)] leading-relaxed">{product.description || product.short_description}</p>

              {product.ingredients.length > 0 && (
                <div className="mt-6">
                  <p className="label-eyebrow !text-[var(--cp-text-muted)]">Ingredients</p>
                  <p className="mt-1.5 text-sm text-[var(--cp-text)]">{product.ingredients.join(" · ")}</p>
                </div>
              )}
              {product.allergens.length > 0 && (
                <div className="mt-5 p-4 rounded-lg bg-[var(--cp-accent)]/10 border border-[var(--cp-accent)]/30">
                  <p className="text-xs font-mono uppercase tracking-wider text-[var(--cp-accent-dark)]">Allergens</p>
                  <p className="mt-1 text-sm text-[var(--cp-text)]">{product.allergens.join(", ")}</p>
                </div>
              )}

              <div className="mt-8 flex items-center gap-4">
                <div className="inline-flex items-center border border-[var(--cp-border)] rounded-lg">
                  <button className="px-3.5 py-2.5 text-lg" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                  <span className="px-3 font-mono">{qty}</span>
                  <button className="px-3.5 py-2.5 text-lg" onClick={() => setQty(qty + 1)}>+</button>
                </div>
                <button
                  disabled={!product.available}
                  onClick={() => add({ id: product.id, name: product.name, slug: product.slug, price_kes: product.price_kes, image_url: product.image_url, category: product.category }, qty)}
                  className="btn-cta flex-1 disabled:opacity-50"
                >
                  <ShoppingCart size={16} /> Add to Cart
                </button>
              </div>

              <a
                href={`https://wa.me/254724848228?text=${encodeURIComponent(`Hi Clare, I'd like to order: ${product.name} x${qty}`)}`}
                target="_blank" rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 text-sm text-[var(--cp-accent)] hover:underline"
              >
                <MessageCircle size={16} /> Order via WhatsApp
              </a>

              <p className="mt-6 text-xs text-[var(--cp-text-muted)]">Available for delivery or store pickup in Busia Town.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
