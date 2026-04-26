import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/store/use-cart";
import { useCurrencyStore, formatPrice, useExchangeRate } from "@/store/use-currency";
import { useAuth } from "@/store/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  CheckCircle2,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  User,
  Truck,
  CreditCard,
  Lock,
  ChevronRight,
  MapPin,
  Clock,
} from "lucide-react";
import { useLocation } from "wouter";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type Step = "ORDER" | "DETAILS" | "DELIVERY" | "PAYMENT" | "CONFIRMED";

const STEPS: { id: Step; label: string; icon: any }[] = [
  { id: "ORDER", label: "Review", icon: ShoppingBag },
  { id: "DETAILS", label: "Details", icon: User },
  { id: "DELIVERY", label: "Delivery", icon: Truck },
  { id: "PAYMENT", label: "Payment", icon: CreditCard },
];

import { useSettings } from "@/hooks/use-settings";

export default function CheckoutPage() {
  const { items, clearCart, subtotal, itemCount } = useCart();
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const { data: settings } = useSettings();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const [currentStep, setCurrentStep] = useState<Step>("ORDER");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    fulfillment: "PICKUP" as "DELIVERY" | "PICKUP",
    paymentMethod: "MPESA" as "MPESA" | "CASH" | "CARD",
    notes: "",
  });

  const { role } = useAuth();

  // Pre-fill from auth ONLY for customers
  useEffect(() => {
    if (user && role === "CUSTOMER") {
      setFormData(prev => ({
        ...prev,
        name: user.user_metadata?.full_name || prev.name,
        email: user.email || prev.email,
        phone: user.user_metadata?.phone || prev.phone,
      }));
    }
  }, [user, role]);

  // Redirect if cart is empty and not on confirmed step
  useEffect(() => {
    if (items.length === 0 && currentStep !== "CONFIRMED") {
      setLocation("/cart");
    }
  }, [items, currentStep, setLocation]);

  const deliveryFee = formData.fulfillment === "DELIVERY" ? (settings?.deliveryFeeKes ?? 100) : 0;
  const total = subtotal + deliveryFee;

  const nextStep = () => {
    if (currentStep === "ORDER") setCurrentStep("DETAILS");
    else if (currentStep === "DETAILS") {
      if (!formData.name || !formData.phone) {
        setError("Name and Phone are required.");
        return;
      }
      setError(null);
      setCurrentStep("DELIVERY");
    }
    else if (currentStep === "DELIVERY") {
      if (formData.fulfillment === "DELIVERY" && !formData.address) {
        setError("Delivery address is required.");
        return;
      }
      setError(null);
      setCurrentStep("PAYMENT");
    }
  };

  const prevStep = () => {
    if (currentStep === "DETAILS") setCurrentStep("ORDER");
    else if (currentStep === "DELIVERY") setCurrentStep("DETAILS");
    else if (currentStep === "PAYMENT") setCurrentStep("DELIVERY");
  };

  const placeOrder = async () => {
    setPlacing(true);
    setError(null);

    try {
      const trackingToken = crypto.randomUUID();
      
      const { data: order, error: orderError } = await supabase
        .from("Order")
        .insert({
          guestName: formData.name,
          guestEmail: formData.email || null,
          guestPhone: formData.phone,
          deliveryStreet: formData.fulfillment === "DELIVERY" ? formData.address : null,
          deliveryPhone: formData.phone,
          fulfillment: formData.fulfillment,
          paymentMethod: formData.paymentMethod,
          subtotalKes: subtotal,
          deliveryFeeKes: deliveryFee,
          totalKes: total,
          displayCurrency: currency,
          displayTotal: total, // or conversion if needed
          notes: formData.notes || null,
          status: "PENDING",
          paymentStatus: "UNPAID",
          trackingToken,
          userId: user?.id || null,
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
          `New Order!\nID: ${order.id.slice(0, 8)}\nCustomer: ${formData.name}\nPhone: ${formData.phone}\nItems: ${itemsList}\nTotal: KES ${total}\nType: ${formData.fulfillment}`
        );
        fetch(`https://api.callmebot.com/whatsapp.php?phone=${cbPhone}&text=${msg}&apikey=${cbKey}`).catch(() => {});
      }

      setOrderId(order.id);
      setCurrentStep("CONFIRMED");
      clearCart();
    } catch (err: any) {
      console.error("Order insertion failed:", err);
      setError(err.message || "Something went wrong.");
    } finally {
      setPlacing(false);
    }
  };

  if (currentStep === "CONFIRMED") {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto py-20 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-3xl p-8 md:p-12 text-center shadow-xl"
          >
            <div className="h-24 w-24 bg-green-50 rounded-full flex items-center justify-center text-green-600 mx-auto mb-8">
              <CheckCircle2 className="h-14 w-14" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-[var(--cp-text)] mb-4">Order Confirmed!</h1>
            <p className="text-muted-foreground text-lg mb-10">
              Thank you, {formData.name.split(" ")[0]}. We&apos;ve received your order and Clare is already in the kitchen.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
              <div className="p-6 bg-[var(--cp-surface-2)] rounded-2xl border border-[var(--cp-border)]">
                <p className="text-[0.65rem] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1">Order Reference</p>
                <p className="font-mono text-xl font-bold">#{orderId?.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="p-6 bg-[var(--cp-surface-2)] rounded-2xl border border-[var(--cp-border)]">
                <p className="text-[0.65rem] font-mono font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Paid/Due</p>
                <p className="font-mono text-xl font-bold">{formatPrice(total, currency, rate)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="rounded-full px-10 h-14 font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)] shadow-lg shadow-primary/20"
                onClick={() => setLocation(`/orders/${orderId}`)}
              >
                Track Live Status <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <button 
                onClick={() => setLocation("/menu")}
                className="px-10 h-14 font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </motion.div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        {/* Stepper */}
        <div className="mb-12 max-w-4xl mx-auto">
          <div className="relative flex justify-between items-center">
            {STEPS.map((s, idx) => {
              const active = STEPS.findIndex(st => st.id === currentStep) >= idx;
              const current = s.id === currentStep;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-300 border-2",
                    active ? "bg-primary border-primary text-white" : "bg-background border-[var(--cp-border)] text-muted-foreground",
                    current && "ring-4 ring-primary/20 scale-110"
                  )}>
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className={cn(
                    "absolute top-12 whitespace-nowrap text-[0.7rem] font-bold uppercase tracking-widest transition-colors",
                    active ? "text-primary" : "text-muted-foreground"
                  )}>
                    {s.label}
                  </span>
                </div>
              );
            })}
            {/* Background Line */}
            <div className="absolute top-5 left-0 right-0 h-[2px] bg-[var(--cp-border)] -z-0" />
            <motion.div 
              className="absolute top-5 left-0 h-[2px] bg-primary -z-0"
              initial={{ width: "0%" }}
              animate={{ width: `${(STEPS.findIndex(st => st.id === currentStep) / (STEPS.length - 1)) * 100}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start mt-20">
          {/* Main Content */}
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-2xl p-6 md:p-10 shadow-sm"
              >
                {/* Step 1: Order Review */}
                {currentStep === "ORDER" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-serif font-bold text-[var(--cp-text)]">Review Your Order</h2>
                    <div className="space-y-4">
                      {items.map((it) => (
                        <div key={it.product.id} className="flex justify-between items-center py-4 border-b border-[var(--cp-border)] last:border-0">
                          <div className="flex gap-4 items-center">
                            <div className="h-16 w-16 rounded-lg overflow-hidden shrink-0 border border-[var(--cp-border)] bg-[var(--cp-surface-2)]">
                              <img src={it.product.imageUrl} className="h-full w-full object-cover" />
                            </div>
                            <div>
                              <p className="font-bold text-[var(--cp-text)]">{it.product.name}</p>
                              <p className="text-xs text-[var(--cp-text-muted)]">{it.quantity} x {formatPrice(it.product.priceKes, currency, rate)}</p>
                            </div>
                          </div>
                          <p className="font-mono font-bold">{formatPrice(it.product.priceKes * it.quantity, currency, rate)}</p>
                        </div>
                      ))}
                    </div>
                    <div className="pt-4">
                      <Button onClick={nextStep} className="w-full rounded-xl h-14 text-base font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)]">
                        Continue to Details <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 2: Details */}
                {currentStep === "DETAILS" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-serif font-bold text-[var(--cp-text)]">Your Contact Information</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name*</Label>
                        <Input 
                          value={formData.name} 
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Jane Otieno" 
                          className="rounded-xl h-12 border-muted-foreground/20" 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Phone Number*</Label>
                        <Input 
                          value={formData.phone} 
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          placeholder="+254..." 
                          className="rounded-xl h-12 border-muted-foreground/20" 
                        />
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email Address</Label>
                        <Input 
                          value={formData.email} 
                          onChange={(e) => setFormData({...formData, email: e.target.value})}
                          placeholder="jane@example.com" 
                          className="rounded-xl h-12 border-muted-foreground/20" 
                        />
                      </div>
                    </div>
                    {error && <p className="text-[var(--cp-error)] text-sm font-medium">{error}</p>}
                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" onClick={prevStep} className="flex-1 rounded-xl h-14 border-[var(--cp-border)]">
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back
                      </Button>
                      <Button onClick={nextStep} className="flex-[2] rounded-xl h-14 text-base font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)]">
                        Delivery Method <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 3: Delivery */}
                {currentStep === "DELIVERY" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-serif font-bold text-[var(--cp-text)]">How should we fulfill your order?</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button 
                        onClick={() => setFormData({...formData, fulfillment: "DELIVERY"})}
                        className={cn(
                          "p-6 rounded-2xl border-2 text-left transition-all",
                          formData.fulfillment === "DELIVERY" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-[var(--cp-border)] hover:bg-muted"
                        )}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-2 rounded-lg", formData.fulfillment === "DELIVERY" ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                            <Truck className="h-6 w-6" />
                          </div>
                          {formData.fulfillment === "DELIVERY" && <CheckCircle2 className="h-6 w-6 text-primary" />}
                        </div>
                        <p className="font-bold text-[var(--cp-text)] text-lg">Doorstep Delivery</p>
                        <p className="text-sm text-muted-foreground">Ksh {settings?.deliveryFeeKes ?? 100} delivery fee applies.</p>
                      </button>

                      <button 
                        onClick={() => setFormData({...formData, fulfillment: "PICKUP"})}
                        className={cn(
                          "p-6 rounded-2xl border-2 text-left transition-all",
                          formData.fulfillment === "PICKUP" ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-[var(--cp-border)] hover:bg-muted"
                        )}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={cn("p-2 rounded-lg", formData.fulfillment === "PICKUP" ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                            <MapPin className="h-6 w-6" />
                          </div>
                          {formData.fulfillment === "PICKUP" && <CheckCircle2 className="h-6 w-6 text-primary" />}
                        </div>
                        <p className="font-bold text-[var(--cp-text)] text-lg">Self Pickup</p>
                        <p className="text-sm text-muted-foreground">Collect for free from our shop.</p>
                      </button>
                    </div>

                    <AnimatePresence>
                      {formData.fulfillment === "DELIVERY" && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-4 overflow-hidden"
                        >
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Delivery Address*</Label>
                            <Input 
                              value={formData.address} 
                              onChange={(e) => setFormData({...formData, address: e.target.value})}
                              placeholder="Estate, House Number, Street" 
                              className="rounded-xl h-12 border-muted-foreground/20" 
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Order Notes / Instructions</Label>
                            <Textarea 
                              value={formData.notes} 
                              onChange={(e) => setFormData({...formData, notes: e.target.value})}
                              placeholder="Gate code, specific directions, or gift notes..." 
                              className="rounded-xl resize-none border-muted-foreground/20" 
                            />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {error && <p className="text-[var(--cp-error)] text-sm font-medium">{error}</p>}

                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" onClick={prevStep} className="flex-1 rounded-xl h-14 border-[var(--cp-border)]">
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back
                      </Button>
                      <Button onClick={nextStep} className="flex-[2] rounded-xl h-14 text-base font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)]">
                        Payment Method <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Step 4: Payment */}
                {currentStep === "PAYMENT" && (
                  <div className="space-y-8">
                    <h2 className="text-2xl font-serif font-bold text-[var(--cp-text)]">Choose how you&apos;ll pay</h2>
                    
                    <div className="space-y-3">
                      {["MPESA", "CARD", "CASH"].map((method) => (
                        <button
                          key={method}
                          onClick={() => setFormData({...formData, paymentMethod: method as any})}
                          className={cn(
                            "w-full p-5 rounded-2xl border-2 flex items-center justify-between transition-all",
                            formData.paymentMethod === method ? "border-primary bg-primary/5 ring-4 ring-primary/10" : "border-[var(--cp-border)] hover:bg-muted"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <div className={cn("p-2 rounded-lg", formData.paymentMethod === method ? "bg-primary text-white" : "bg-muted text-muted-foreground")}>
                              {method === "MPESA" && <Smartphone className="h-5 w-5" />}
                              {method === "CARD" && <CreditCard className="h-5 w-5" />}
                              {method === "CASH" && <Banknote className="h-5 w-5" />}
                            </div>
                            <div className="text-left">
                              <p className="font-bold text-[var(--cp-text)]">
                                {method === "MPESA" ? "M-Pesa Express" : method === "CARD" ? "Credit / Debit Card" : "Cash on Delivery"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {method === "MPESA" ? "A prompt will be sent to your phone" : method === "CARD" ? "Pay securely via iPay" : "Pay when your order arrives"}
                              </p>
                            </div>
                          </div>
                          {formData.paymentMethod === method && <CheckCircle2 className="h-5 w-5 text-primary" />}
                        </button>
                      ))}
                    </div>

                    <div className="p-6 bg-[var(--cp-surface-2)] rounded-2xl border border-[var(--cp-border)] space-y-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Order Subtotal</span>
                        <span className="font-mono font-bold">{formatPrice(subtotal, currency, rate)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span className="font-mono font-bold text-green-600">+{formatPrice(deliveryFee, currency, rate)}</span>
                      </div>
                      <div className="h-[1px] w-full bg-border opacity-50" />
                      <div className="flex justify-between items-center">
                        <span className="font-serif font-bold text-lg">Total to Pay</span>
                        <span className="font-mono font-bold text-2xl text-primary">{formatPrice(total, currency, rate)}</span>
                      </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                      <Button variant="outline" onClick={prevStep} className="flex-1 rounded-xl h-14 border-[var(--cp-border)]">
                        <ArrowLeft className="mr-2 h-5 w-5" /> Back
                      </Button>
                      <Button 
                        onClick={placeOrder} 
                        disabled={placing}
                        className="flex-[2] rounded-xl h-14 text-base font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)] shadow-xl shadow-primary/20"
                      >
                        {placing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : null}
                        Complete Order <ChevronRight className="ml-1 h-5 w-5" />
                      </Button>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Side Summary (Only on large screens) */}
          <div className="hidden lg:block lg:col-span-4 sticky top-[100px]">
            <Card className="rounded-2xl border-[var(--cp-border)] bg-[var(--cp-surface)] shadow-lg overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-lg font-serif font-bold mb-6">Summary</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Items ({itemCount})</span>
                    <span className="font-mono font-bold">{formatPrice(subtotal, currency, rate)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="font-mono font-bold">{deliveryFee === 0 ? "Free" : formatPrice(deliveryFee, currency, rate)}</span>
                  </div>
                  <div className="h-[1px] w-full bg-border opacity-50" />
                  <div className="flex justify-between items-baseline pt-2">
                    <span className="font-bold">Total</span>
                    <div className="text-right">
                      <span className="text-2xl font-mono font-bold text-primary">{formatPrice(total, currency, rate)}</span>
                      {currency === "KES" && (
                        <p className="text-[0.6rem] font-mono text-muted-foreground">≈ UGX {(total * (rate || 30)).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-[var(--cp-border)] border-dashed space-y-4">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Lock className="h-4 w-4 text-primary" />
                    <span>Secure end-to-end encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Delivery in {settings?.deliveryEstimate ?? '45–90 mins'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper icons missing from imports
function Smartphone(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
}
function Banknote(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
}
