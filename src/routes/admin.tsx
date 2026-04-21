import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ShieldCheck,
  Loader2,
  LogOut,
  Package,
  CheckCircle2,
  Truck,
  Clock,
  Flame,
  XCircle,
  Phone,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, signOut } from "@/lib/auth";
import { formatKES } from "@/lib/format";
import { ProductsAdmin } from "@/components/admin/ProductsAdmin";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [{ title: "Admin — Clare Pastries" }, { name: "robots", content: "noindex,nofollow" }],
  }),
});

type OrderStatus =
  | "pending"
  | "confirmed"
  | "baking"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "collected"
  | "cancelled";
type PaymentStatus = "unpaid" | "paid" | "refunded";

interface AdminOrder {
  id: string;
  customer_name: string;
  customer_phone: string;
  fulfillment: "delivery" | "pickup";
  total_kes: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method: string | null;
  created_at: string;
  address_street: string | null;
  address_town: string | null;
  order_notes: string | null;
}

interface AdminOrderItem {
  product_name: string;
  quantity: number;
  unit_price_kes: number;
}

const STATUS_FLOW: OrderStatus[] = [
  "pending",
  "confirmed",
  "baking",
  "ready",
  "out_for_delivery",
  "delivered",
];

const STATUS_META: Record<OrderStatus, { label: string; Icon: typeof Clock; tone: string }> = {
  pending: { label: "Pending", Icon: Clock, tone: "text-amber-400" },
  confirmed: { label: "Confirmed", Icon: CheckCircle2, tone: "text-blue-400" },
  baking: { label: "Baking", Icon: Flame, tone: "text-orange-400" },
  ready: { label: "Ready", Icon: Package, tone: "text-emerald-400" },
  out_for_delivery: { label: "Out for delivery", Icon: Truck, tone: "text-cyan-400" },
  delivered: { label: "Delivered", Icon: CheckCircle2, tone: "text-green-500" },
  collected: { label: "Collected", Icon: CheckCircle2, tone: "text-green-500" },
  cancelled: { label: "Cancelled", Icon: XCircle, tone: "text-red-400" },
};

function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate({ to: "/login", search: { redirect: "/admin", mode: "login" } });
    }
  }, [loading, user, navigate]);

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

  if (!user) return null;

  if (!isAdmin) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-28 pb-20 container-cp text-center">
          <ShieldCheck className="h-12 w-12 mx-auto text-[var(--cp-text-muted)] mb-4" />
          <h1 className="font-display text-3xl mb-2">Admin only</h1>
          <p className="text-[var(--cp-text-muted)] mb-6">
            Your account doesn't have admin privileges.
          </p>
          <button onClick={signOut} className="btn-cta">
            Sign out
          </button>
        </main>
        <Footer />
      </>
    );
  }

  return <AdminDashboard />;
}

function AdminDashboard() {
  const [tab, setTab] = useState<"orders" | "products">("orders");
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [items, setItems] = useState<Record<string, AdminOrderItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data, error } = await supabase
        .from("orders")
        .select(
          "id, customer_name, customer_phone, fulfillment, total_kes, status, payment_status, payment_method, created_at, address_street, address_town, order_notes"
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (!mounted) return;
      if (error) {
        console.error(error);
      } else {
        setOrders((data ?? []) as AdminOrder[]);
      }
      setLoading(false);
    }
    load();

    // Realtime: refresh on any order change
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        load();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchItems(orderId: string) {
    if (items[orderId]) return;
    const { data } = await supabase
      .from("order_items")
      .select("product_name, quantity, unit_price_kes")
      .eq("order_id", orderId);
    setItems((s) => ({ ...s, [orderId]: (data ?? []) as AdminOrderItem[] }));
  }

  async function setStatus(orderId: string, status: OrderStatus) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (error) console.error(error);
  }

  async function togglePaid(orderId: string, current: PaymentStatus) {
    const next: PaymentStatus = current === "paid" ? "unpaid" : "paid";
    const { error } = await supabase
      .from("orders")
      .update({ payment_status: next })
      .eq("id", orderId);
    if (error) console.error(error);
  }

  const filtered = useMemo(
    () => (filter === "all" ? orders : orders.filter((o) => o.status === filter)),
    [orders, filter]
  );

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todays = orders.filter((o) => new Date(o.created_at).toDateString() === today);
    return {
      todayCount: todays.length,
      todayRevenue: todays
        .filter((o) => o.payment_status === "paid")
        .reduce((s, o) => s + o.total_kes, 0),
      pending: orders.filter((o) =>
        ["pending", "confirmed", "baking", "ready", "out_for_delivery"].includes(o.status)
      ).length,
    };
  }, [orders]);

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 pb-20 bg-[var(--cp-bg)]">
        <div className="container-cp">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="label-eyebrow mb-1">Admin Dashboard</p>
              <h1 className="font-display text-4xl">Orders</h1>
            </div>
            <button
              onClick={signOut}
              className="inline-flex items-center gap-2 text-sm px-4 py-2 rounded-full border border-[var(--cp-border)] hover:bg-[var(--cp-surface-2)]"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <StatCard label="Today's orders" value={stats.todayCount.toString()} />
            <StatCard label="Today's revenue" value={formatKES(stats.todayRevenue)} />
            <StatCard label="In progress" value={stats.pending.toString()} accent />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(["all", ...STATUS_FLOW, "cancelled"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-colors",
                  filter === s
                    ? "bg-[var(--cp-accent)] text-[#1A1410]"
                    : "bg-[var(--cp-surface-2)] text-[var(--cp-text-muted)] hover:text-[var(--cp-text)]",
                ].join(" ")}
              >
                {s === "all" ? "All" : STATUS_META[s].label}
              </button>
            ))}
          </div>

          {/* Orders */}
          {loading ? (
            <div className="grid place-items-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[var(--cp-accent)]" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-[var(--cp-text-muted)]">
              No orders {filter !== "all" && `with status "${STATUS_META[filter].label}"`}.
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((o, i) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  index={i}
                  items={items[o.id]}
                  onExpand={() => fetchItems(o.id)}
                  onSetStatus={(s) => setStatus(o.id, s)}
                  onTogglePaid={() => togglePaid(o.id, o.payment_status)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={[
        "rounded-2xl border p-5",
        accent
          ? "bg-[var(--cp-accent)] text-[#1A1410] border-transparent"
          : "bg-[var(--cp-surface)] border-[var(--cp-border)]",
      ].join(" ")}
    >
      <p className="text-xs font-mono uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className="font-display text-3xl">{value}</p>
    </div>
  );
}

function OrderRow({
  order,
  index,
  items,
  onExpand,
  onSetStatus,
  onTogglePaid,
}: {
  order: AdminOrder;
  index: number;
  items?: AdminOrderItem[];
  onExpand: () => void;
  onSetStatus: (s: OrderStatus) => void;
  onTogglePaid: () => void;
}) {
  const [open, setOpen] = useState(false);
  const meta = STATUS_META[order.status];
  const Icon = meta.Icon;

  function toggle() {
    setOpen((v) => !v);
    if (!open) onExpand();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.03, 0.3) }}
      className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-xl overflow-hidden"
    >
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between p-4 hover:bg-[var(--cp-surface-2)] transition-colors text-left"
      >
        <div className="flex items-center gap-4 min-w-0">
          <Icon className={`h-5 w-5 shrink-0 ${meta.tone}`} />
          <div className="min-w-0">
            <p className="font-medium truncate">
              #{order.id.slice(0, 8).toUpperCase()} · {order.customer_name}
            </p>
            <p className="text-xs text-[var(--cp-text-muted)] font-mono">
              {new Date(order.created_at).toLocaleString("en-KE", {
                hour: "2-digit",
                minute: "2-digit",
                day: "numeric",
                month: "short",
              })}{" "}
              · {order.fulfillment}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
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
          <span className="font-display text-lg">{formatKES(order.total_kes)}</span>
        </div>
      </button>

      {open && (
        <div className="border-t border-[var(--cp-border)] p-4 space-y-4 bg-[var(--cp-bg)]">
          {/* Customer */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs font-mono uppercase text-[var(--cp-text-muted)] mb-1">
                Customer
              </p>
              <p>{order.customer_name}</p>
              <a
                href={`tel:${order.customer_phone}`}
                className="inline-flex items-center gap-1.5 text-[var(--cp-accent)] hover:underline mt-1"
              >
                <Phone size={14} />
                {order.customer_phone}
              </a>
            </div>
            <div>
              <p className="text-xs font-mono uppercase text-[var(--cp-text-muted)] mb-1">
                {order.fulfillment === "delivery" ? "Delivery" : "Pickup"}
              </p>
              <p>
                {order.fulfillment === "delivery"
                  ? `${order.address_street ?? "—"}, ${order.address_town ?? "—"}`
                  : "Customer will collect"}
              </p>
              {order.order_notes && (
                <p className="text-[var(--cp-text-muted)] mt-1 italic">
                  Note: {order.order_notes}
                </p>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-mono uppercase text-[var(--cp-text-muted)] mb-2">Items</p>
            {items ? (
              <ul className="space-y-1 text-sm">
                {items.map((it, i) => (
                  <li key={i} className="flex justify-between">
                    <span>
                      {it.quantity}× {it.product_name}
                    </span>
                    <span className="font-mono">{formatKES(it.unit_price_kes * it.quantity)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--cp-border)]">
            <button
              onClick={onTogglePaid}
              className={[
                "px-3 py-1.5 rounded-full text-xs font-mono",
                order.payment_status === "paid"
                  ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                  : "bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25",
              ].join(" ")}
            >
              Mark as {order.payment_status === "paid" ? "unpaid" : "paid"}
            </button>
            {STATUS_FLOW.map((s) => (
              <button
                key={s}
                onClick={() => onSetStatus(s)}
                disabled={order.status === s}
                className={[
                  "px-3 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider",
                  order.status === s
                    ? "bg-[var(--cp-accent)] text-[#1A1410] cursor-default"
                    : "bg-[var(--cp-surface-2)] text-[var(--cp-text-muted)] hover:text-[var(--cp-text)]",
                ].join(" ")}
              >
                {STATUS_META[s].label}
              </button>
            ))}
            <button
              onClick={() => onSetStatus("cancelled")}
              className="px-3 py-1.5 rounded-full text-xs font-mono bg-red-500/15 text-red-400 hover:bg-red-500/25 ml-auto"
            >
              Cancel
            </button>
          </div>
          <Link
            to="/orders/$id"
            params={{ id: order.id }}
            className="text-xs text-[var(--cp-accent)] hover:underline"
          >
            View customer tracking page →
          </Link>
        </div>
      )}
    </motion.div>
  );
}
