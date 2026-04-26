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
} from "lucide-react";
import { Link } from "wouter";
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

type ConfirmedOrder = {
  id: string;
  trackingToken: string;
  totalKes: number;
};

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  // Security: Don't pre-fill admin info into guest checkout forms
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [fulfillment, setFulfillment] = useState<"DELIVERY" | "PICKUP">("DELIVERY");
  const [paymentMethod, setPaymentMethod] = useState<"MPESA" | "CASH" | "CARD">("MPESA");
  const [confirmedOrder, setConfirmedOrder] = useState<ConfirmedOrder | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placeError, setPlaceError] = useState("");

  const deliveryFee = fulfillment === "DELIVERY" && subtotal > 0 ? 200 : 0;
  const total = subtotal + deliveryFee;

  const placeOrder = async () => {
    setPlacing(true);
    setPlaceError("");
    try {
      const trackingToken = crypto.randomUUID();

      const { data: order, error: orderError } = await supabase
        .from("Order")
        .insert({
          trackingToken,
          userId: user?.id || null,
          guestName: name,
          guestPhone: phone,
          guestEmail: email || null,
          subtotalKes: subtotal,
          deliveryFeeKes: deliveryFee,
          totalKes: total,
          displayCurrency: currency,
          displayTotal: currency === "KES" ? total : total * (rate ?? 30),
          fulfillment,
          deliveryStreet: fulfillment === "DELIVERY" ? address : null,
          notes: notes || null,
          status: "PENDING",
          paymentStatus: "UNPAID",
          paymentMethod,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      const orderItems = items.map((it) => ({
        orderId: order.id,
        productId: it.product.id,
        productName: it.product.name,
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
    } catch (err: unknown) {
      setPlaceError(err instanceof Error ? err.message : "Failed to place order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0 && !confirmedOrder) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-32 px-4">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4">Your bag is empty</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            Looks like you haven&apos;t added any pastries yet. Let&apos;s fix that.
          </p>
          <Link href="/menu">
            <Button size="lg" className="rounded-full px-8 h-12">
              Browse the Menu <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </Layout>
    );
  }

  if (confirmedOrder) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-32 px-4 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mb-6" />
          <h2 className="text-3xl font-serif font-bold mb-3">Order Placed!</h2>
          <p className="text-muted-foreground mb-2">Thank you, {name || "friend"}.</p>
          <p className="font-mono text-lg mb-2">#{confirmedOrder.trackingToken.slice(0, 8).toUpperCase()}</p>
          <p className="text-muted-foreground mb-8 max-w-md">
            We&apos;ll call you on {phone} to confirm. Pay{" "}
            {formatPrice(confirmedOrder.totalKes, currency, rate)} via M-Pesa to{" "}
            <span className="font-mono">+254 724 848228</span>.
          </p>
          <div className="flex gap-3">
            <Link href="/menu">
              <Button size="lg" variant="outline" className="rounded-full">Browse more</Button>
            </Link>
            <Link href="/account">
              <Button size="lg" className="rounded-full">View my orders</Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-10">Your Bag</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <Card key={item.product.id} className="overflow-hidden border-border bg-card shadow-sm">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-32 h-32 sm:h-auto bg-muted shrink-0">
                      {item.product.imageUrl && (
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <CardContent className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-foreground">{item.product.name}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-1">{item.product.category}</p>
                        </div>
                        <p className="font-mono font-bold text-primary">
                          {formatPrice(item.product.priceKes * item.quantity, currency, rate)}
                        </p>
                      </div>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-border rounded-full bg-background">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-l-full"
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          ><Minus className="h-3 w-3" /></Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8 rounded-r-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          ><Plus className="h-3 w-3" /></Button>
                        </div>
                        <Button
                          variant="ghost" size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.product.id)}
                        ><Trash2 className="h-4 w-4 mr-2" /> Remove</Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-1">
              <Card className="bg-muted/30 border border-border shadow-sm sticky top-24">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif font-bold mb-6">Order Summary</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono font-medium">{formatPrice(subtotal, currency, rate)}</span>
                    </div>
                    {fulfillment === "DELIVERY" && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span className="font-mono font-medium">{formatPrice(deliveryFee, currency, rate)}</span>
                      </div>
                    )}
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-foreground">Total</span>
                      <span className="text-xl font-mono font-bold text-primary">{formatPrice(total, currency, rate)}</span>
                    </div>
                  </div>
                  <Button
                    size="lg"
                    className="w-full mt-8 rounded-full h-12 text-base shadow-md shadow-primary/20"
                    onClick={() => setOpen(true)}
                  >Proceed to Checkout</Button>
                  <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                    <Phone className="h-3 w-3" />
                    <span>Need help? Call +254 724 848228</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Complete Your Order</DialogTitle>
            <DialogDescription>Tell us where to send your bakes. We&apos;ll confirm by phone.</DialogDescription>
          </DialogHeader>

          <form
            onSubmit={(e) => { e.preventDefault(); placeOrder(); }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="co-name">Full Name</Label>
                <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" className="rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-phone">Phone Number</Label>
                <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+254..." className="rounded-xl" required />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="co-email">Email (optional)</Label>
              <Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" className="rounded-xl" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="co-notes">Order Notes (optional)</Label>
              <Textarea id="co-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Special instructions or preferences..." className="rounded-xl" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Fulfillment</Label>
                <Select value={fulfillment} onValueChange={(v) => setFulfillment(v as "DELIVERY" | "PICKUP")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DELIVERY">Delivery (+Ksh 200)</SelectItem>
                    <SelectItem value="PICKUP">Pickup (Free)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as "MPESA" | "CASH" | "CARD")}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MPESA">M-Pesa</SelectItem>
                    <SelectItem value="CASH">Cash</SelectItem>
                    <SelectItem value="CARD">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <AnimatePresence>
              {fulfillment === "DELIVERY" && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="space-y-2 overflow-hidden"
                >
                  <Label htmlFor="co-addr">Delivery Address</Label>
                  <Input id="co-addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Estate, street, landmark" className="rounded-xl" required />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-muted/50 p-4 rounded-2xl border border-border mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-muted-foreground">Total to Pay</span>
                <span className="text-xl font-mono font-bold text-primary">
                  {formatPrice(total, currency, rate)}
                </span>
              </div>
            </div>

            {placeError && <p className="text-sm text-destructive font-medium">{placeError}</p>}

            <div className="flex flex-col gap-2 pt-2">
              <Button type="submit" disabled={placing} className="w-full rounded-full h-12 font-bold shadow-lg shadow-primary/20">
                {placing ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Place Order"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="w-full rounded-full h-10">
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
