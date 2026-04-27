import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/store/use-cart";
import { useCurrencyStore, formatPrice, useExchangeRate } from "@/store/use-currency";
import { useAuth } from "@/store/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  Phone,
  CheckCircle2,
  Loader2,
  Lock,
  Smartphone,
  CreditCard,
  Banknote,
  Truck,
  Store,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { useSettings } from "@/hooks/use-settings";

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal, itemCount } = useCart();
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const { user } = useAuth();
  const { data: settings } = useSettings();
  const [, setLocation] = useLocation();

  const [open, setOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<{ id: string; trackingToken: string; totalKes: number } | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CASH">("MPESA");
  const [notes, setNotes] = useState("");

  const deliveryFee = fulfillment === "DELIVERY" && subtotal > 0 ? (settings?.deliveryFeeKes ?? 100) : 0;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    if (!name || !phone || (fulfillment === "DELIVERY" && !address)) {
      setPlaceError("Please fill in all required fields.");
      return;
    }

    setPlacing(true);
    setPlaceError(null);

    try {
      const trackingToken = Math.random().toString(36).substring(2, 15);
      
      const { data: order, error: orderError } = await supabase
        .from("Order")
        .insert({
          customerName: name,
          customerEmail: email || null,
          customerPhone: phone,
          deliveryAddress: fulfillment === "DELIVERY" ? address : null,
          fulfillmentType: fulfillment,
          paymentMethod,
          subtotalKes: subtotal,
          deliveryFeeKes: deliveryFee,
          totalKes: total,
          notes: notes || null,
          status: "PENDING",
          trackingToken,
          userId: user?.id || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((it) => ({
        orderId: order.id,
        productId: it.product.id,
        quantity: it.quantity,
        unitPriceKes: it.product.priceKes,
        totalPriceKes: it.product.priceKes * it.quantity,
      }));

      const { error: itemsError } = await supabase.from("OrderItem").insert(orderItems);
      if (itemsError) throw itemsError;

      // WhatsApp notification
      const cbPhone = (import.meta as any).env.VITE_CALLMEBOT_PHONE;
      const cbKey = (import.meta as any).env.VITE_CALLMEBOT_API_KEY;
      if (cbPhone && cbKey) {
        const itemsList = items.map((i) => `${i.quantity}x ${i.product.name}`).join(", ");
        const msg = encodeURIComponent(
          `New Order!\nID: ${order.id.slice(0, 8)}\nCustomer: ${name}\nPhone: ${phone}\nItems: ${itemsList}\nTotal: KES ${total}\nType: ${fulfillment}`
        );
        fetch(`https://api.callmebot.com/whatsapp.php?phone=${cbPhone}&text=${msg}&apikey=${cbKey}`).catch(() => {});
      }

      setConfirmedOrder({ id: order.id, trackingToken, totalKes: total });
      clearCart();
    } catch (err: any) {
      setPlaceError(err.message || "Something went wrong.");
    } finally {
      setPlacing(false);
    }
  };

  if (confirmedOrder) {
    return (
      <Layout>
        <div className="max-w-2xl mx-auto py-20 px-6 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 className="h-12 w-12" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground">Order Placed!</h1>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Thank you, {name.split(" ")[0]}. Clare is getting started on your order.
            </p>
            
            <div className="bg-[var(--cp-surface-2)] border border-dashed border-[var(--cp-border)] p-6 rounded-xl w-full max-w-sm">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Order Reference</p>
              <p className="font-mono text-xl font-bold">#{confirmedOrder.id.slice(0, 8).toUpperCase()}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center mt-4">
              <Button 
                size="lg" 
                className="rounded-full px-8 h-12 font-bold shadow-lg shadow-primary/20"
                onClick={() => setLocation(`/orders/${confirmedOrder.id}?token=${confirmedOrder.trackingToken}`)}
              >
                Track Your Order <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Link href="/menu">
                <Button variant="ghost" size="lg" className="rounded-full px-8 h-12">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  if (items.length === 0) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto py-32 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-6"
          >
            <div className="p-8 rounded-full bg-[var(--cp-surface-2)]">
              <ShoppingBag className="h-20 w-20 text-[var(--cp-text-muted)] opacity-30" />
            </div>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Your cart is empty</h2>
            <p className="text-muted-foreground text-lg max-w-md">
              Browse Clare&apos;s menu and add something delicious to your bag.
            </p>
            <div className="flex flex-col gap-4">
              <Link href="/menu">
                <Button size="lg" className="rounded-full px-10 h-14 text-base font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)] shadow-lg shadow-primary/20 transition-all">
                  Browse Menu <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground transition-colors">
                  ← Back to Home
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Page Header */}
        <div className="flex justify-between items-baseline mb-10 border-b border-[var(--cp-border)] pb-6">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--cp-text)]">Shopping Cart</h1>
          <span className="text-lg font-sans text-[var(--cp-text-muted)] font-medium">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Items */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-background rounded-2xl overflow-hidden">
              <AnimatePresence mode="popLayout">
                {items.map((it, idx) => (
                  <motion.div
                    key={it.product.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    className={cn(
                      "flex gap-4 md:gap-6 py-6 md:py-8",
                      idx !== items.length - 1 && "border-b border-[var(--cp-border)]"
                    )}
                  >
                    {/* Item Image */}
                    <div className="h-20 w-20 md:h-28 md:w-28 rounded-xl overflow-hidden shrink-0 border border-[var(--cp-border)] bg-[var(--cp-surface-2)]">
                      <img src={it.product.imageUrl} alt={it.product.name} className="h-full w-full object-cover" />
                    </div>

                    {/* Item Details */}
                    <div className="flex-1 flex flex-col min-w-0">
                      <div className="flex justify-between items-start gap-4 mb-1">
                        <div className="min-w-0">
                          <h3 className="text-lg font-serif font-bold truncate text-[var(--cp-text)]">{it.product.name}</h3>
                          <span className="text-[0.65rem] font-mono font-bold uppercase tracking-widest text-[var(--cp-text-muted)] bg-[var(--cp-surface-2)] px-2 py-0.5 rounded-full">
                            {it.product.category}
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-mono text-lg font-bold text-[var(--cp-accent)]">
                            {formatPrice(it.product.priceKes * it.quantity, currency, rate)}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-[var(--cp-text-muted)] mb-4">
                        {formatPrice(it.product.priceKes, currency, rate)} per item
                      </p>

                      <div className="mt-auto flex items-center justify-between">
                        {/* Qty Selector */}
                        <div className="flex items-center border border-[var(--cp-border)] rounded-full h-9 bg-background shadow-sm">
                          <button
                            onClick={() => updateQuantity(it.product.id, Math.max(1, it.quantity - 1))}
                            className="w-8 h-full flex items-center justify-center hover:bg-muted transition-colors rounded-l-full"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="font-mono text-sm font-bold w-8 text-center">
                            {it.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(it.product.id, it.quantity + 1)}
                            className="w-8 h-full flex items-center justify-center hover:bg-muted transition-colors rounded-r-full"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>

                        {/* Remove */}
                        <button
                          onClick={() => removeItem(it.product.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-[var(--cp-error)] hover:opacity-80 transition-opacity"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-6 border-t border-[var(--cp-border)]">
              <Link href="/menu">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium">
                  ← Continue Shopping
                </Button>
              </Link>

              <div className="flex gap-2 w-full sm:w-auto">
                <Input placeholder="Enter promo code" className="rounded-xl h-11 w-full sm:w-48" />
                <Button variant="outline" className="rounded-xl h-11 px-6 border-[var(--cp-border)] hover:bg-muted" onClick={() => console.log("Coming soon")}>
                  Apply
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-[100px]">
            <Card className="rounded-2xl border-[var(--cp-border)] bg-[var(--cp-surface)] shadow-xl shadow-black/5 overflow-hidden">
              <CardContent className="p-6 md:p-8">
                <p className="text-[0.75rem] font-mono font-bold uppercase tracking-[0.1em] text-[var(--cp-text-muted)] mb-6">
                  Order Summary
                </p>
                
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--cp-text-muted)] font-medium">Subtotal ({itemCount} {itemCount === 1 ? 'item' : 'items'})</span>
                    <span className="text-[var(--cp-text)] font-mono font-bold">{formatPrice(subtotal, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--cp-text-muted)] font-medium">Delivery fee</span>
                    <span className="text-green-600 font-mono font-bold text-[0.75rem] bg-green-50 px-2 py-0.5 rounded-full">Calculated at checkout</span>
                  </div>
                  
                  <Separator className="bg-[var(--cp-border)] my-6 opacity-50" />
                  
                  <div>
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="text-[0.8rem] font-mono font-bold uppercase text-[var(--cp-text)]">Total</span>
                      <span className="text-3xl font-serif font-bold text-[var(--cp-text)]">
                        {formatPrice(subtotal, currency, rate)}
                      </span>
                    </div>
                    {currency === "KES" && (
                      <p className="text-[0.75rem] font-mono text-[var(--cp-text-muted)] text-right">
                        ≈ UGX {(subtotal * (rate || 30)).toLocaleString()}
                      </p>
                    )}
                  </div>

                  <Button
                    size="lg"
                    className="w-full mt-6 rounded-xl h-14 text-base font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)] text-[var(--cp-cta-text)] shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    onClick={() => setLocation("/checkout")}
                  >
                    Proceed to Checkout <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>

                  <div className="pt-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2 text-[var(--cp-text-muted)]">
                        <Lock className="h-3.5 w-3.5 text-[var(--cp-accent)]" />
                        <span className="text-[0.8rem] font-medium">Secure checkout</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--cp-text-muted)]">
                        <Smartphone className="h-3.5 w-3.5 text-[var(--cp-accent)]" />
                        <span className="text-[0.8rem] font-medium">M-Pesa accepted</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--cp-text-muted)]">
                        <CreditCard className="h-3.5 w-3.5 text-[var(--cp-accent)]" />
                        <span className="text-[0.8rem] font-medium">Card accepted</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--cp-text-muted)]">
                        <Banknote className="h-3.5 w-3.5 text-[var(--cp-accent)]" />
                        <span className="text-[0.8rem] font-medium">Cash on delivery</span>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[var(--cp-border)] border-dashed space-y-2">
                      <div className="flex items-center gap-2 text-[var(--cp-text-muted)]">
                        <Truck className="h-3.5 w-3.5 text-[var(--cp-accent)]" />
                        <span className="text-[0.8rem]">Delivery: {settings?.deliveryEstimate ?? '45–90 minutes'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-[var(--cp-text-muted)]">
                        <Store className="h-3.5 w-3.5 text-[var(--cp-accent)]" />
                        <span className="text-[0.8rem]">Free pickup available</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <MobileCheckoutBar />
    </Layout>
  );
}

function MobileCheckoutBar() {
  const { subtotal } = useCart();
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const [, setLocation] = useLocation();

  if (subtotal === 0) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[var(--cp-surface)] border-t border-[var(--cp-border)] p-4 pb-8 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
      <div className="flex flex-col">
        <span className="text-[0.65rem] font-bold uppercase tracking-widest text-[var(--cp-text-muted)]">Total</span>
        <span className="text-xl font-mono font-bold text-[var(--cp-text)]">{formatPrice(subtotal, currency, rate)}</span>
      </div>
      <Button 
        onClick={() => setLocation("/checkout")}
        className="rounded-xl px-8 h-12 font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)] shadow-lg shadow-primary/20"
      >
        Checkout <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
