import { Layout } from "@/components/layout/Layout";
import { useCart } from "@/store/use-cart";
import { useCurrencyStore, formatPrice, useExchangeRate } from "@/store/use-currency";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, Phone } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const deliveryFee = subtotal > 0 ? 150 : 0; // 150 KES flat delivery fee
  const total = subtotal + deliveryFee;

  const handleCheckout = () => {
    setShowCheckoutModal(true);
  };

  const confirmOrder = () => {
    // In a real app, this would create an order in the backend
    clearCart();
    setShowCheckoutModal(false);
  };

  if (items.length === 0) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center py-32 px-4">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <ShoppingBag className="h-10 w-10 text-muted-foreground" />
          </div>
          <h2 className="text-3xl font-serif font-bold mb-4">Your bag is empty</h2>
          <p className="text-muted-foreground mb-8 text-center max-w-md">
            Looks like you haven't added any delicious pastries to your bag yet. Let's fix that.
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

  return (
    <Layout>
      <div className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-10">Your Bag</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <Card key={item.product.id} className="overflow-hidden border-border bg-card shadow-sm">
                  <div className="flex flex-col sm:flex-row">
                    <div className="w-full sm:w-32 h-32 sm:h-auto bg-muted shrink-0">
                      <img 
                        src={item.product.imageUrl} 
                        alt={item.product.name} 
                        className="w-full h-full object-cover"
                      />
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
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-l-full"
                            onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-r-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => removeItem(item.product.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" /> Remove
                        </Button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-muted/30 border border-border shadow-sm sticky top-24">
                <CardContent className="p-6 md:p-8">
                  <h3 className="text-2xl font-serif font-bold mb-6">Order Summary</h3>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-mono font-medium">{formatPrice(subtotal, currency, rate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Delivery (Busia Town)</span>
                      <span className="font-mono font-medium">{formatPrice(deliveryFee, currency, rate)}</span>
                    </div>
                    <Separator className="my-4" />
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-foreground">Total</span>
                      <span className="text-xl font-mono font-bold text-primary">{formatPrice(total, currency, rate)}</span>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full mt-8 rounded-full h-12 text-base shadow-md shadow-primary/20"
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </Button>

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

      <Dialog open={showCheckoutModal} onOpenChange={setShowCheckoutModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-2xl">Complete Your Order</DialogTitle>
            <DialogDescription>
              We process payments manually to ensure your order is perfect.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/50 p-6 rounded-lg text-center space-y-4 my-4 border border-border">
            <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">Total Amount</div>
            <div className="text-3xl font-mono font-bold text-primary">{formatPrice(total, currency, rate)}</div>
            
            <Separator className="my-4" />
            
            <p className="text-foreground">
              To complete your order, please pay via M-Pesa to:
            </p>
            <div className="font-mono text-xl font-bold bg-background py-2 px-4 rounded-md inline-block border border-border">
              +254 724 848228
            </div>
            <p className="text-sm text-muted-foreground">
              Name: Clare Pastries
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
            <Button onClick={confirmOrder} className="w-full rounded-full h-12">
              I Have Paid — Confirm Order
            </Button>
            <Button variant="outline" onClick={() => setShowCheckoutModal(false)} className="w-full rounded-full h-12">
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
