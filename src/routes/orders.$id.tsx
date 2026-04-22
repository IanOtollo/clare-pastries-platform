import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Loader2, CheckCircle2, Clock, Flame, Package, Truck, XCircle, Wheat } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";

export const Route = createFileRoute("/orders/$id")({
  component: OrderTrackingPage,
  head: () => ({
    meta: [
      { title: "Track your order — Clare Pastries" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
});

type OrderStatus =
  | "pending" | "confirmed" | "baking" | "ready"
  | "out_for_delivery" | "delivered" | "collected" | "cancelled";

interface TrackedOrder {
  id: string;
  customer_name: string;
  fulfillment: "delivery" | "pickup";
  total_kes: number;
  subtotal_kes: number;
  delivery_fee_kes: number;
  status: OrderStatus;
  payment_status: "unpaid" | "paid" | "refunded";
  payment_method: string | null;
  created_at: string;
}

interface TrackedItem {
  product_name: string;
  quantity: number;
  unit_price_kes: number;
}

const TIMELINE: { key: OrderStatus; label: string; Icon: typeof Clock }[] = [
  { key: "pending", label: "Order received", Icon: Clock },
  { key: "confirmed", label: "Confirmed", Icon: CheckCircle2 },
  { key: "baking", label: "Baking", Icon: Flame },
  { key: "ready", label: "Ready", Icon: Package },
];

function OrderTrackingPage() {
  const { id } = Route.useParams();
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [items, setItems] = useState<TrackedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      // Tracking is intentionally accessible via order ID — anyone with the link can view.
      // We use a server fn instead of direct query because RLS blocks public SELECT on orders.
      const res = await fetch(`/api/public/track-order?id=${encodeURIComponent(id)}`);
      if (!mounted) return;
      if (!res.ok) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setOrder(json.order);
      setItems(json.items ?? []);
      setLoading(false);
    }

    load();

    // Realtime status updates
    const ch = supabase
      .channel(`order-${id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=eq.${id}` },
        () => load()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(ch);
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 pb-20 grid place-items-center">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--cp-accent)]" />
        </main>
        <Footer />
      </>
    );
  }

  if (notFound || !order) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 pb-20 container-cp text-center">
          <Wheat className="h-12 w-12 mx-auto text-[var(--cp-text-muted)] mb-4" />
          <h1 className="font-display text-3xl mb-2">Order not found</h1>
          <p className="text-[var(--cp-text-muted)] mb-6">
            The order ID may be incorrect, or the order may have been removed.
          </p>
          <Link to="/menu" className="btn-cta">
            Browse menu →
          </Link>
        </main>
        <Footer />
      </>
    );
  }

  const isCancelled = order.status === "cancelled";
  const isFinal = order.status === "delivered" || order.status === "collected";
  const finalLabel = order.fulfillment === "delivery" ? "Delivered" : "Collected";
  const finalIcon = order.fulfillment === "delivery" ? Truck : CheckCircle2;
  const timeline = [
    ...TIMELINE,
    order.fulfillment === "delivery"
      ? { key: "out_for_delivery" as OrderStatus, label: "Out for delivery", Icon: Truck }
      : null,
    { key: (order.fulfillment === "delivery" ? "delivered" : "collected") as OrderStatus, label: finalLabel, Icon: finalIcon },
  ].filter(Boolean) as typeof TIMELINE;

  const currentIdx = timeline.findIndex((t) => t.key === order.status);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20 bg-[var(--cp-bg)]">
        <div className="container-cp max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <p className="label-eyebrow mb-2">Order tracking</p>
            <h1 className="font-display text-4xl md:text-5xl mb-2">
              #{order.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-[var(--cp-text-muted)]">
              Hi {order.customer_name.split(" ")[0]} — here's the live status of your order.
            </p>
          </motion.div>

          {/* Timeline */}
          {isCancelled ? (
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center mb-8">
              <XCircle className="h-10 w-10 mx-auto text-red-400 mb-3" />
              <p className="font-display text-2xl mb-1">Order cancelled</p>
              <p className="text-sm text-[var(--cp-text-muted)]">
                Please contact us if this was unexpected.
              </p>
            </div>
          ) : (
            <div className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-2xl p-6 md:p-8 mb-6">
              <div className="space-y-5">
                {timeline.map((step, i) => {
                  const Icon = step.Icon;
                  const done = i <= currentIdx;
                  const active = i === currentIdx && !isFinal;
                  return (
                    <div key={step.key} className="flex items-start gap-4">
                      <div
                        className={[
                          "shrink-0 h-10 w-10 rounded-full grid place-items-center transition-all",
                          done
                            ? "bg-[var(--cp-accent)] text-[#1A1410]"
                            : "bg-[var(--cp-surface-2)] text-[var(--cp-text-muted)]",
                          active ? "ring-4 ring-[var(--cp-accent)]/30 animate-pulse" : "",
                        ].join(" ")}
                      >
                        <Icon size={18} />
                      </div>
                      <div className="pt-2">
                        <p
                          className={[
                            "font-medium",
                            done ? "text-[var(--cp-text)]" : "text-[var(--cp-text-muted)]",
                          ].join(" ")}
                        >
                          {step.label}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-2xl p-6 md:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-2xl">Order summary</h2>
              <span
                className={[
                  "text-xs font-mono px-2 py-1 rounded-full",
                  order.payment_status === "paid"
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-amber-500/15 text-amber-400",
                ].join(" ")}
              >
                {order.payment_status.toUpperCase()}
              </span>
            </div>

            <ul className="space-y-2 text-sm">
              {items.map((it, i) => (
                <li key={i} className="flex justify-between">
                  <span>
                    {it.quantity}× {it.product_name}
                  </span>
                  <span className="font-mono">{formatKES(it.unit_price_kes * it.quantity)}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-[var(--cp-border)] pt-4 space-y-1.5 text-sm">
              <div className="flex justify-between text-[var(--cp-text-muted)]">
                <span>Subtotal</span>
                <span className="font-mono">{formatKES(order.subtotal_kes)}</span>
              </div>
              {order.delivery_fee_kes > 0 && (
                <div className="flex justify-between text-[var(--cp-text-muted)]">
                  <span>Delivery</span>
                  <span className="font-mono">{formatKES(order.delivery_fee_kes)}</span>
                </div>
              )}
              <div className="flex justify-between font-display text-xl pt-2">
                <span>Total</span>
                <span>{formatKES(order.total_kes)}</span>
              </div>
            </div>
          </div>

          <div className="text-center mt-8 text-sm text-[var(--cp-text-muted)]">
            Questions? Call or WhatsApp{" "}
            <a href="tel:+254714399302" className="text-[var(--cp-accent)] hover:underline">
              +254 714 399 302
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
