import { Link } from "wouter";
import { formatPrice, useCurrencyStore, useExchangeRate } from "@/store/use-currency";
import { useCart } from "@/store/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Minus, ShoppingCart, Check, Star, Wheat } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();
  
  const [qty, setQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [showAndTell, setShowAndTell] = useState(false);

  const handleAdd = () => {
    addItem({
      id: product.id,
      name: product.name,
      priceKes: product.priceKes,
      imageUrl: product.imageUrl,
      category: product.category,
      slug: product.slug?.current
    }, qty);
    
    setIsAdded(true);
    setShowAndTell(true);
    
    setTimeout(() => {
      setIsAdded(false);
      setShowAndTell(false);
    }, 1500);
    
    toast({
      title: "Added to cart",
      description: `${qty}x ${product.name} added to your bag.`,
    });
  };

  const increment = () => setQty(q => q + 1);
  const decrement = () => setQty(q => Math.max(1, q - 1));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="h-full"
    >
      <Card className={cn(
        "overflow-hidden h-full flex flex-col group border-[var(--cp-border)] bg-[var(--cp-surface)] transition-all duration-220 ease-in-out hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)]",
        !product.available && "opacity-60 grayscale-[0.6]"
      )}>
        {/* Image Area */}
        <div className="relative aspect-[4/3] overflow-hidden bg-[var(--cp-surface-2)]">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Wheat className="h-10 w-10 text-[var(--cp-text-muted)] opacity-20" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3">
            <span className="bg-white/92 backdrop-blur-sm text-[var(--cp-text-muted)] text-[0.65rem] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm">
              {product.category}
            </span>
          </div>

          {product.featured && (
            <div className="absolute top-3 right-3">
              <div className="bg-primary/90 text-primary-foreground p-1.5 rounded-full shadow-sm">
                <Star className="h-3 w-3 fill-current" />
              </div>
            </div>
          )}

          {/* Unavailable Overlay */}
          {!product.available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <span className="text-white font-sans font-medium text-sm tracking-wide bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
                Currently Unavailable
              </span>
            </div>
          )}
        </div>

        {/* Body */}
        <CardContent className="p-4 md:p-5 flex flex-col flex-1">
          <div className="mb-3">
            <h3 className="font-serif text-[1.2rem] font-semibold text-[var(--cp-text)] leading-tight line-clamp-2 mb-1 group-hover:text-primary transition-colors">
              {product.name}
            </h3>
            <p className="font-sans text-[0.875rem] text-[var(--cp-text-muted)] line-clamp-2">
              {product.shortDescription || product.description}
            </p>
          </div>

          {/* Price Row */}
          <div className="pt-2 mt-auto">
            <div className="border-t border-[var(--cp-border)] pt-3 flex justify-between items-baseline mb-4">
              <span className="font-mono text-[1.1rem] font-bold text-[var(--cp-accent)]">
                {currency === "KES" ? `KES ${product.priceKes.toLocaleString()}` : formatPrice(product.priceKes, currency, rate)}
              </span>
              {currency === "KES" && (
                <span className="font-mono text-[0.8rem] text-[var(--cp-text-muted)]">
                  UGX ~{(product.priceKes * (rate || 30)).toLocaleString()}
                </span>
              )}
            </div>

            {/* Actions Row */}
            <div className="flex gap-3 items-center">
              {/* Qty Selector */}
              <div className="flex items-center border border-[var(--cp-border)] rounded-full h-10 bg-background shadow-sm overflow-hidden shrink-0">
                <button
                  onClick={decrement}
                  disabled={qty <= 1 || !product.available}
                  className="w-8 h-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="font-mono text-sm font-bold min-width-[32px] text-center px-1">
                  {qty}
                </span>
                <button
                  onClick={increment}
                  disabled={!product.available}
                  className="w-8 h-full flex items-center justify-center hover:bg-muted transition-colors disabled:opacity-30"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>

              {/* Add Button */}
              <Button
                onClick={handleAdd}
                disabled={!product.available || isAdded}
                className={cn(
                  "flex-1 h-10 rounded-lg font-sans font-medium text-[0.875rem] transition-all duration-300 shadow-sm",
                  isAdded 
                    ? "bg-green-600 hover:bg-green-600 text-white" 
                    : "bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)] text-[var(--cp-cta-text)] hover:scale-[1.01] active:scale-[0.98]"
                )}
              >
                <AnimatePresence mode="wait">
                  {isAdded ? (
                    <motion.div
                      key="added"
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.5, opacity: 0 }}
                      className="flex items-center"
                    >
                      <Check className="h-4 w-4 mr-1.5" />
                      Added!
                    </motion.div>
                  ) : (
                    <motion.div
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1.5" />
                      Add to Cart
                    </motion.div>
                  )}
                </AnimatePresence>
              </Button>
            </div>
          </div>
        </CardContent>

        {/* Flying Effect */}
        <AnimatePresence>
          {showAndTell && (
            <motion.div
              initial={{ scale: 0.5, x: 0, y: 0, opacity: 1 }}
              animate={{ 
                scale: 0.2, 
                x: typeof window !== 'undefined' ? window.innerWidth * 0.4 : 500, 
                y: typeof window !== 'undefined' ? -window.innerHeight * 0.8 : -800,
                opacity: 0 
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeInOut" }}
              className="fixed pointer-events-none z-[100] h-32 w-32 rounded-2xl overflow-hidden shadow-2xl border-4 border-primary"
              style={{ 
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              {product.imageUrl && <img src={product.imageUrl} alt="" className="w-full h-full object-cover" />}
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
