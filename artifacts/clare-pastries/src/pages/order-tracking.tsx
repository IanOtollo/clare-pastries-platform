import { Layout } from "@/components/layout/Layout";
import { formatPrice, useCurrencyStore, useExchangeRate } from "@/store/use-currency";
import { supabase } from "@/lib/supabase";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  CheckCircle2, 
  Clock, 
  UtensilsCrossed, 
  Package, 
  Truck, 
  Home,
  ChevronRight,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Order, OrderItem } from "@/types";

const STATUS_STEPS = [
  { id: "PENDING", label: "Order Received", icon: Clock, desc: "We've received your order and are reviewing it." },
  { id: "CONFIRMED", label: "Confirmed", icon: CheckCircle2, desc: "Order confirmed! Clare is preparing the ingredients." },
  { id: "BAKING", label: "In the Oven", icon: UtensilsCrossed, desc: "Your pastries are being baked with love." },
  { id: "READY", label: "Ready for Pickup", icon: Package, desc: "Freshly baked and packaged. Ready for collection!" },
  { id: "OUT_FOR_DELIVERY", label: "Out for Delivery", icon: Truck, desc: "Our rider is on the way to your doorstep." },
  { id: "DELIVERED", label: "Delivered", icon: Home, desc: "Enjoy your delicious pastries!" },
];

import { useSettings } from "@/hooks/use-settings";

export default function OrderTracking() {
  const { id } = useParams();
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const token = searchParams.get('token');
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const { data: settings } = useSettings();

  const { data: order, isLoading, error } = useQuery({
    queryKey: ['order', id, token],
    queryFn: async () => {
      let query = supabase
        .from('Order')
        .select('*, items:OrderItem(*)')
        .eq('id', id);
      
      if (token) {
        query = query.eq('trackingToken', token);
      }

      const { data, error } = await query.single();
      if (error) throw error;
      return data as Order & { items: OrderItem[] };
    },
    refetchInterval: 10000, // Refetch every 10 seconds for "live" feel
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-32">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground font-medium">Fetching your order status...</p>
        </div>
      </Layout>
    );
  }

  if (error || !order) {
    return (
      <Layout>
        <div className="max-w-md mx-auto py-32 px-6 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6" />
          <h2 className="text-2xl font-serif font-bold mb-2">Order Not Found</h2>
          <p className="text-muted-foreground mb-8">We couldn&apos;t find an order with this ID or tracking token.</p>
          <button 
            onClick={() => window.location.href = '/menu'}
            className="w-full bg-[var(--cp-cta)] text-white h-12 rounded-full font-bold"
          >
            Back to Menu
          </button>
        </div>
      </Layout>
    );
  }

  const currentStatusIdx = STATUS_STEPS.findIndex(s => s.id === order.status);
  const activeSteps = STATUS_STEPS.slice(0, currentStatusIdx + 1);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12 border-b border-[var(--cp-border)] pb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[var(--cp-text)] mb-2">Track Your Order</h1>
            <p className="text-muted-foreground flex items-center gap-2">
              Order <span className="font-mono font-bold text-[var(--cp-text)]">#{order.id.slice(0, 8).toUpperCase()}</span>
              <ChevronRight className="h-4 w-4" />
              <span className="font-medium text-primary bg-primary/5 px-2 py-0.5 rounded-full">{order.status.replace(/_/g, ' ')}</span>
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-sm text-muted-foreground uppercase tracking-widest font-bold">Estimated Arrival</p>
            <p className="text-2xl font-mono font-bold text-[var(--cp-accent)]">
              {order.status === 'DELIVERED' ? 'Arrived' : (settings?.deliveryEstimate ?? '25–40 mins')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Status Timeline */}
          <div className="lg:col-span-7">
            <div className="space-y-0 relative">
              {/* Vertical Line */}
              <div className="absolute left-6 top-8 bottom-8 w-[2px] bg-[var(--cp-border)] -z-0" />
              <motion.div 
                className="absolute left-6 top-8 w-[2px] bg-primary -z-0"
                initial={{ height: 0 }}
                animate={{ height: `${(currentStatusIdx / (STATUS_STEPS.length - 1)) * 100}%` }}
                style={{ maxHeight: 'calc(100% - 64px)' }}
              />

              {STATUS_STEPS.map((step, idx) => {
                const isCompleted = idx < currentStatusIdx;
                const isCurrent = idx === currentStatusIdx;
                const isUpcoming = idx > currentStatusIdx;

                return (
                  <motion.div 
                    key={step.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className={cn(
                      "relative z-10 flex gap-6 pb-12 last:pb-0",
                      isUpcoming && "opacity-40"
                    )}
                  >
                    <div className={cn(
                      "h-12 w-12 rounded-full flex items-center justify-center shrink-0 border-4 transition-all duration-500",
                      isCompleted ? "bg-primary border-primary text-white" : 
                      isCurrent ? "bg-white border-primary text-primary animate-pulse" : 
                      "bg-white border-[var(--cp-border)] text-muted-foreground"
                    )}>
                      {isCompleted ? <CheckCircle2 className="h-6 w-6" /> : <step.icon className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className={cn("text-lg font-bold transition-colors", isCurrent ? "text-primary" : "text-[var(--cp-text)]")}>
                        {step.label}
                      </h3>
                      <p className="text-sm text-[var(--cp-text-muted)] mt-1">{step.desc}</p>
                      {isCurrent && (
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          className="h-1 bg-primary/20 rounded-full mt-3 overflow-hidden"
                        >
                          <motion.div 
                            animate={{ x: ["-100%", "100%"] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                            className="h-full w-1/2 bg-primary"
                          />
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Details Sidebar */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="rounded-2xl border-[var(--cp-border)] bg-[var(--cp-surface)] shadow-sm overflow-hidden">
              <CardContent className="p-8">
                <h3 className="text-lg font-serif font-bold mb-6">Delivery Details</h3>
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="p-2 h-10 w-10 rounded-lg bg-[var(--cp-surface-2)] flex items-center justify-center text-primary shrink-0">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Destination</p>
                      <p className="text-[var(--cp-text)] font-medium">
                        {order.fulfillment === 'DELIVERY' ? order.deliveryStreet || 'Address not specified' : 'Pickup from Clare Pastries Shop'}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-2 h-10 w-10 rounded-lg bg-[var(--cp-surface-2)] flex items-center justify-center text-primary shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Order Date</p>
                      <p className="text-[var(--cp-text)] font-medium">
                        {new Date(order.createdAt).toLocaleDateString('en-KE', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="p-2 h-10 w-10 rounded-lg bg-[var(--cp-surface-2)] flex items-center justify-center text-primary shrink-0">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Customer Contact</p>
                      <p className="text-[var(--cp-text)] font-medium">{order.guestPhone || order.deliveryPhone}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 pt-8 border-t border-[var(--cp-border)]">
                  <h4 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Items Summary</h4>
                  <div className="space-y-3">
                    {order.items?.map((it) => (
                      <div key={it.id} className="flex justify-between text-sm">
                        <span className="text-[var(--cp-text)]">{it.quantity}x {it.productName || 'Product'}</span>
                        <span className="font-mono font-bold">{formatPrice(it.totalPriceKes, currency, rate)}</span>
                      </div>
                    ))}
                    <Separator className="my-2 opacity-50" />
                    <div className="flex justify-between items-baseline pt-2">
                      <span className="font-bold">Total Amount</span>
                      <span className="text-xl font-mono font-bold text-primary">{formatPrice(order.totalKes, currency, rate)}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-10 bg-primary/5 rounded-xl p-6 border border-primary/10">
                  <p className="text-sm font-medium text-primary mb-2">Need help with your order?</p>
                  <p className="text-xs text-muted-foreground mb-4">Our customer support is available 8am–8pm.</p>
                  <a 
                    href="tel:+254724848228" 
                    className="flex items-center justify-center gap-2 bg-primary text-white h-10 rounded-lg text-sm font-bold shadow-sm"
                  >
                    <Phone className="h-4 w-4" /> Call Clare Pastries
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Separator({ className }: { className?: string }) {
  return <div className={cn("h-[1px] w-full bg-border", className)} />
}
