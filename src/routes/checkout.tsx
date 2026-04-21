import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Wheat, Flame, Package, Smartphone, CheckCircle2, Truck, Store, Banknote, CreditCard } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { useCart } from "@/lib/cart";
import { formatKES } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/checkout")({ component: Checkout });

const STEPS = [
  { Icon: Wheat, label: "Your Order" },
  { Icon: Flame, label: "Your Details" },
  { Icon: Package, label: "Summary" },
  { Icon: Smartphone, label: "Payment" },
  { Icon: CheckCircle2, label: "Confirmed" },
];

function Checkout() {
  const items = useCart((s) => s.items);
  const subtotal = useCart((s) => s.items.reduce((sum, i) => sum + i.qty * i.price_kes, 0));
  const clear = useCart((s) => s.clear);
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [fulfillment, setFulfillment] = useState<"delivery" | "pickup">("delivery");
  const [addr, setAddr] = useState({ street: "", landmark: "", house: "", town: "Busia Town", phone: "", notes: "" });
  const [details, setDetails] = useState({ name: "", phone: "", email: "" });
  const [payMethod, setPayMethod] = useState<"mpesa" | "card" | "cash">("mpesa");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stkPhone, setStkPhone] = useState("");
  const [payState, setPayState] = useState<"idle" | "waiting" | "paid" | "failed">("idle");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  function pollPayment(id: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries += 1;
      try {
        const r = await fetch(`/api/public/payment-status?orderId=${id}`);
        const j = await r.json();
        if (j?.payment_status === "paid") {
          setPayState("paid");
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        /* ignore */
      }
      if (tries > 40) {
        // ~2 min @ 3s
        setPayState((s) => (s === "paid" ? s : "failed"));
        if (pollRef.current) clearInterval(pollRef.current);
      }
    }, 3000);
  }

  async function triggerStk(id: string, phone: string) {
    setPayState("waiting");
    setError(null);
    try {
      const res = await fetch("/api/public/payhero-initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id, phone }),
      });
      const j = await res.json();
      if (!j.ok) throw new Error(j.error || "Could not start M-Pesa payment.");
      pollPayment(id);
    } catch (e) {
      setPayState("failed");
      setError(e instanceof Error ? e.message : "M-Pesa request failed.");
    }
  }

  const deliveryFee = fulfillment === "delivery" ? 100 : 0;
  const total = subtotal + deliveryFee;

  if (items.length === 0 && !orderId) {
    return (
      <>
        <Navbar />
        <main className="pt-28 pb-24 container-cp text-center">
          <p className="font-display text-3xl">Your cart is empty.</p>
          <Link to="/menu" className="btn-cta mt-6 inline-flex">Browse Menu →</Link>
        </main>
        <Footer />
      </>
    );
  }

  async function placeOrder() {
    setSubmitting(true); setError(null);
    try {
      const { data: order, error: oerr } = await supabase
        .from("orders")
        .insert({
          customer_name: details.name.trim(),
          customer_phone: details.phone.trim(),
          customer_email: details.email.trim() || null,
          fulfillment,
          address_street: fulfillment === "delivery" ? addr.street.trim() : null,
          address_landmark: fulfillment === "delivery" ? addr.landmark.trim() : null,
          address_house: fulfillment === "delivery" ? addr.house.trim() || null : null,
          address_town: fulfillment === "delivery" ? addr.town.trim() : null,
          delivery_phone: fulfillment === "delivery" ? (addr.phone || details.phone) : null,
          delivery_notes: addr.notes || null,
          subtotal_kes: subtotal,
          delivery_fee_kes: deliveryFee,
          total_kes: total,
          payment_method: payMethod,
        })
        .select("id")
        .single();
      if (oerr) throw oerr;

      const { error: ierr } = await supabase.from("order_items").insert(
        items.map((it) => ({
          order_id: order.id,
          product_id: it.id,
          product_name: it.name,
          unit_price_kes: it.price_kes,
          quantity: it.qty,
        }))
      );
      if (ierr) throw ierr;

      setOrderId(order.id);
      clear();
      setStep(4);

      // Fire-and-forget WhatsApp notification — never blocks the order
      void fetch("/api/public/notify-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      }).catch(() => {});

      // Auto-trigger M-Pesa STK if selected
      if (payMethod === "mpesa") {
        const phone = (details.phone || "").trim();
        setStkPhone(phone);
        void triggerStk(order.id, phone);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not place order. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24">
        <div className="container-cp max-w-3xl">
          <Stepper step={step} />

          <div className="mt-10 cp-card !p-7 md:!p-10">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {step === 0 && (
                  <div>
                    <h2 className="font-display text-3xl">Your Order</h2>
                    <ul className="mt-5 divide-y divide-[var(--cp-border)] text-sm">
                      {items.map((i) => (
                        <li key={i.id} className="py-3 flex justify-between">
                          <span>{i.name} <span className="text-[var(--cp-text-muted)]">× {i.qty}</span></span>
                          <span className="font-mono">{formatKES(i.qty * i.price_kes)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8 grid sm:grid-cols-2 gap-3">
                      <FulfillCard active={fulfillment === "delivery"} onClick={() => setFulfillment("delivery")} Icon={Truck} title="Delivery" sub="To your door · KES 100" />
                      <FulfillCard active={fulfillment === "pickup"} onClick={() => setFulfillment("pickup")} Icon={Store} title="Pickup" sub="From Clare's kitchen · Free" />
                    </div>

                    {fulfillment === "delivery" && (
                      <div className="mt-6 grid md:grid-cols-2 gap-4">
                        <Field label="Street / Road" req><input className={input} value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} placeholder="e.g. Jinja Road" /></Field>
                        <Field label="Landmark" req><input className={input} value={addr.landmark} onChange={(e) => setAddr({ ...addr, landmark: e.target.value })} placeholder="e.g. Opposite Equity Bank" /></Field>
                        <Field label="House / Building"><input className={input} value={addr.house} onChange={(e) => setAddr({ ...addr, house: e.target.value })} /></Field>
                        <Field label="Town" req><input className={input} value={addr.town} onChange={(e) => setAddr({ ...addr, town: e.target.value })} /></Field>
                        <Field label="Notes" full><textarea className={input} rows={2} value={addr.notes} onChange={(e) => setAddr({ ...addr, notes: e.target.value })} /></Field>
                      </div>
                    )}

                    {fulfillment === "pickup" && (
                      <div className="mt-6 p-4 rounded-lg bg-[var(--cp-surface-2)] text-sm">
                        Clare's Kitchen, Busia Town. Call <a className="text-[var(--cp-accent)]" href="tel:+254724848228">+254 724 848228</a> when you arrive.
                      </div>
                    )}

                    <NavButtons onNext={() => setStep(1)} nextDisabled={fulfillment === "delivery" && (!addr.street || !addr.landmark || !addr.town)} />
                  </div>
                )}

                {step === 1 && (
                  <div>
                    <h2 className="font-display text-3xl">Your Details</h2>
                    <div className="mt-6 grid md:grid-cols-2 gap-4">
                      <Field label="Full Name" req><input className={input} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} /></Field>
                      <Field label="Phone" req><input className={input} value={details.phone} onChange={(e) => setDetails({ ...details, phone: e.target.value })} placeholder="+254…" /></Field>
                      <Field label="Email (optional)" full><input type="email" className={input} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} /></Field>
                    </div>
                    <NavButtons onBack={() => setStep(0)} onNext={() => setStep(2)} nextDisabled={!details.name.trim() || details.phone.trim().length < 7} />
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="font-display text-3xl">Summary</h2>
                    <div className="mt-5 space-y-4 text-sm">
                      <Row label="Customer" value={`${details.name} · ${details.phone}`} />
                      <Row label="Fulfillment" value={fulfillment === "delivery" ? `Delivery to ${addr.street}, ${addr.landmark}, ${addr.town}` : "Pickup at Clare's Kitchen"} />
                      <ul className="border-t border-[var(--cp-border)] pt-3 divide-y divide-[var(--cp-border)]">
                        {items.map((i) => (
                          <li key={i.id} className="py-2 flex justify-between"><span>{i.name} × {i.qty}</span><span className="font-mono">{formatKES(i.qty * i.price_kes)}</span></li>
                        ))}
                      </ul>
                      <Row label="Subtotal" value={formatKES(subtotal)} />
                      <Row label="Delivery" value={formatKES(deliveryFee)} />
                      <Row label="Total" value={formatKES(total)} bold />
                    </div>
                    <NavButtons onBack={() => setStep(1)} onNext={() => setStep(3)} nextLabel="Looks good. Pay Now →" />
                  </div>
                )}

                {step === 3 && (
                  <div>
                    <h2 className="font-display text-3xl">Payment</h2>
                    <div className="mt-6 grid sm:grid-cols-3 gap-3">
                      <PayCard active={payMethod === "mpesa"} onClick={() => setPayMethod("mpesa")} Icon={Smartphone} title="M-Pesa" sub="Paybill 714888" />
                      <PayCard active={payMethod === "card"} onClick={() => setPayMethod("card")} Icon={CreditCard} title="Card" sub="Visa / Mastercard" />
                      <PayCard active={payMethod === "cash"} onClick={() => setPayMethod("cash")} Icon={Banknote} title="Cash" sub="On delivery" />
                    </div>

                    {payMethod === "mpesa" && (
                      <div className="mt-6 p-5 rounded-lg bg-[var(--cp-surface-2)]">
                        <p className="text-sm text-[var(--cp-text-muted)]">M-Pesa STK Push will be sent to your phone for</p>
                        <p className="font-mono text-2xl text-[var(--cp-accent)] mt-1">{formatKES(total)}</p>
                        <p className="text-xs text-[var(--cp-text-muted)] mt-2">Paybill <span className="font-mono">714888</span> · Account <span className="font-mono">257457</span></p>
                      </div>
                    )}
                    {payMethod === "cash" && (
                      <div className="mt-6 p-5 rounded-lg bg-[var(--cp-surface-2)] text-sm">
                        Please have <span className="font-mono">{formatKES(total)}</span> ready when your order arrives.
                      </div>
                    )}
                    {payMethod === "card" && (
                      <div className="mt-6 p-5 rounded-lg bg-[var(--cp-surface-2)] text-sm">
                        Card payment opens after you confirm your order.
                      </div>
                    )}

                    {error && <p className="mt-4 text-sm text-[var(--cp-error)]">{error}</p>}

                    <NavButtons
                      onBack={() => setStep(2)}
                      onNext={placeOrder}
                      nextLabel={submitting ? "Placing…" : "Place Order →"}
                      nextDisabled={submitting}
                    />
                  </div>
                )}

                {step === 4 && orderId && (
                  <div className="text-center py-6">
                    <CheckCircle2 size={64} className="mx-auto text-[var(--cp-success)]" />
                    <h2 className="mt-5 font-display text-4xl">Order Placed!</h2>
                    <p className="mt-2 text-[var(--cp-text-muted)]">Thank you, {details.name.split(" ")[0]}. Your pastries are being prepared.</p>
                    <div className="mt-6 inline-block px-5 py-3 rounded-lg bg-[var(--cp-surface-2)] font-mono text-sm">
                      Order #{orderId.slice(0, 8).toUpperCase()}
                    </div>
                    <p className="mt-6 text-sm text-[var(--cp-text-muted)]">
                      {fulfillment === "delivery" ? "Estimated delivery: 45–90 minutes." : "Ready in 30–60 minutes. Call +254 714 399 302 when you arrive."}
                    </p>
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      <Link to="/orders/$id" params={{ id: orderId }} className="btn-cta">Track your order →</Link>
                      <button onClick={() => navigate({ to: "/menu" })} className="px-6 py-3 rounded-lg border border-[var(--cp-border)] hover:bg-[var(--cp-surface-2)]">Continue Shopping</button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stepper({ step }: { step: number }) {
  return (
    <ol className="flex items-center justify-between gap-2">
      {STEPS.map((s, i) => {
        const done = i < step, active = i === step;
        return (
          <li key={s.label} className="flex-1 flex flex-col items-center">
            <div
              className={[
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all",
                done ? "bg-[var(--cp-accent)] border-[var(--cp-accent)] text-[#1A1410]" :
                active ? "bg-[var(--cp-cta)] border-[var(--cp-cta)] text-[var(--cp-cta-text)] ring-4 ring-[var(--cp-cta)]/15" :
                "border-[var(--cp-border)] text-[var(--cp-text-muted)]",
              ].join(" ")}
            >
              <s.Icon size={16} />
            </div>
            <span className={["mt-2 text-[10px] md:text-xs font-mono uppercase tracking-wider text-center", active ? "text-[var(--cp-text)]" : "text-[var(--cp-text-muted)]"].join(" ")}>
              {s.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function NavButtons({ onBack, onNext, nextLabel = "Next →", nextDisabled }: { onBack?: () => void; onNext: () => void; nextLabel?: string; nextDisabled?: boolean }) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      {onBack ? (
        <button onClick={onBack} className="text-sm text-[var(--cp-text-muted)] hover:text-[var(--cp-text)]">← Back</button>
      ) : <span />}
      <button onClick={onNext} disabled={nextDisabled} className="btn-cta disabled:opacity-50 disabled:cursor-not-allowed">{nextLabel}</button>
    </div>
  );
}

function FulfillCard({ active, onClick, Icon, title, sub }: { active: boolean; onClick: () => void; Icon: typeof Truck; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={[
        "p-4 rounded-lg border-2 text-left transition-all",
        active ? "border-[var(--cp-cta)] bg-[var(--cp-cta)]/5" : "border-[var(--cp-border)] hover:border-[var(--cp-text-muted)]",
      ].join(" ")}
    >
      <Icon className="text-[var(--cp-accent)]" size={20} />
      <p className="mt-2 font-medium">{title}</p>
      <p className="text-xs text-[var(--cp-text-muted)] mt-0.5">{sub}</p>
    </button>
  );
}

function PayCard({ active, onClick, Icon, title, sub }: { active: boolean; onClick: () => void; Icon: typeof Smartphone; title: string; sub: string }) {
  return (
    <button
      onClick={onClick}
      className={[
        "p-4 rounded-lg border-2 text-center transition-all",
        active ? "border-[var(--cp-cta)] bg-[var(--cp-cta)]/5" : "border-[var(--cp-border)] hover:border-[var(--cp-text-muted)]",
      ].join(" ")}
    >
      <Icon className="mx-auto text-[var(--cp-accent)]" size={22} />
      <p className="mt-2 font-medium text-sm">{title}</p>
      <p className="text-xs text-[var(--cp-text-muted)]">{sub}</p>
    </button>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-[var(--cp-text-muted)]">{label}</span>
      <span className={["text-right", bold ? "font-mono text-lg text-[var(--cp-text)] font-medium" : "font-mono"].join(" ")}>{value}</span>
    </div>
  );
}

const input = "w-full px-3.5 py-2.5 rounded-lg bg-[var(--cp-bg)] border border-[var(--cp-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]";
function Field({ label, req, full, children }: { label: string; req?: boolean; full?: boolean; children: React.ReactNode }) {
  return (
    <label className={["block", full ? "md:col-span-2" : ""].join(" ")}>
      <span className="block text-xs font-mono uppercase tracking-wider text-[var(--cp-text-muted)] mb-1.5">
        {label} {req && <span className="text-[var(--cp-accent)]">*</span>}
      </span>
      {children}
    </label>
  );
}
