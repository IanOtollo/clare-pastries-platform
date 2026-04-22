import { createFileRoute, Link } from "@tanstack/react-router";
import { ShoppingBag, Trash2, Wheat } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart";
import { usePrefs } from "@/lib/preferences";
import { formatKES, formatUGX } from "@/lib/format";

export const Route = createFileRoute("/cart")({ component: CartPage });

function CartPage() {
  const items = useCart((s) => s.items);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const subtotal = useCart((s) => s.items.reduce((sum, i) => sum + i.qty * i.price_kes, 0));
  const currency = usePrefs((s) => s.currency);
  const deliveryFee = items.length > 0 ? 100 : 0;
  const total = subtotal + deliveryFee;

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24 container-cp">
        <h1 className="font-display text-4xl md:text-5xl">Your Cart</h1>

        {items.length === 0 ? (
          <div className="mt-16 text-center">
            <ShoppingBag className="mx-auto text-[var(--cp-text-muted)]" size={64} />
            <p className="mt-5 font-display text-2xl">Your cart is empty.</p>
            <p className="mt-2 text-[var(--cp-text-muted)]">Browse Clare's menu and add something delicious.</p>
            <Link to="/menu" className="btn-cta mt-7 inline-flex">Browse Menu →</Link>
          </div>
        ) : (
          <div className="mt-10 grid lg:grid-cols-[1fr_360px] gap-10">
            <ul className="space-y-4">
              {items.map((it) => (
                <li key={it.id} className="cp-card !p-4 flex items-center gap-4">
                  <div className="h-20 w-20 rounded-lg overflow-hidden bg-[var(--cp-surface-2)] shrink-0">
                    {it.image_url ? (
                      <img src={it.image_url} alt={it.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center"><Wheat size={28} className="text-[var(--cp-border)]" /></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to="/menu/$slug" params={{ slug: it.slug }} className="font-medium text-[var(--cp-text)] hover:text-[var(--cp-accent)] truncate block">
                      {it.name}
                    </Link>
                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--cp-text-muted)] mt-0.5">{it.category}</p>
                    <p className="font-mono text-sm text-[var(--cp-accent)] mt-1">{formatKES(it.price_kes)}</p>
                  </div>
                  <div className="inline-flex items-center border border-[var(--cp-border)] rounded-lg">
                    <button className="px-2.5 py-1.5" onClick={() => setQty(it.id, it.qty - 1)}>−</button>
                    <span className="px-2.5 font-mono text-sm">{it.qty}</span>
                    <button className="px-2.5 py-1.5" onClick={() => setQty(it.id, it.qty + 1)}>+</button>
                  </div>
                  <span className="font-mono text-sm w-20 text-right hidden sm:inline">{formatKES(it.qty * it.price_kes)}</span>
                  <button onClick={() => remove(it.id)} aria-label="Remove" className="text-[var(--cp-text-muted)] hover:text-[var(--cp-error)] p-1">
                    <Trash2 size={18} />
                  </button>
                </li>
              ))}
            </ul>

            <aside className="cp-card !p-6 h-fit lg:sticky lg:top-28">
              <h2 className="font-display text-2xl">Order Summary</h2>
              <dl className="mt-5 space-y-3 text-sm">
                <div className="flex justify-between"><dt className="text-[var(--cp-text-muted)]">Subtotal</dt><dd className="font-mono">{formatKES(subtotal)}</dd></div>
                <div className="flex justify-between"><dt className="text-[var(--cp-text-muted)]">Delivery (Busia)</dt><dd className="font-mono">{formatKES(deliveryFee)}</dd></div>
                <div className="border-t border-[var(--cp-border)] pt-3 flex justify-between items-baseline">
                  <dt className="font-display text-lg">Total</dt>
                  <dd>
                    <span className="font-mono text-xl font-medium text-[var(--cp-text)]">{formatKES(total)}</span>
                    {currency === "KES" && <p className="font-mono text-xs text-[var(--cp-text-muted)] text-right">≈ {formatUGX(total)}</p>}
                  </dd>
                </div>
              </dl>
              <Link to="/checkout" className="btn-cta w-full mt-6">Proceed to Checkout →</Link>
              <Link to="/menu" className="block text-center mt-3 text-sm text-[var(--cp-text-muted)] hover:text-[var(--cp-text)]">← Continue Shopping</Link>
            </aside>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
