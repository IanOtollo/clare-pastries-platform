type Product = {
  id: string;
  slug: string;
  name: string;
  description?: string;
  priceKes: number;
  category?: string;
  imageUrl?: string;
  featured?: boolean;
  inStock?: boolean;
  servings?: string;
};

import { Link } from "wouter";
import { formatPrice, useCurrencyStore, useExchangeRate } from "@/store/use-currency";
import { useCart } from "@/store/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const addItem = useCart((state) => state.addItem);
  const { toast } = useToast();

  const handleAdd = () => {
    addItem(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your bag.`,
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      <Card className={`overflow-hidden h-full flex flex-col group border-transparent bg-card/50 hover:bg-card transition-colors ${!product.inStock ? 'opacity-60 grayscale-[0.5]' : ''}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
          {!product.inStock && (
            <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-[2px]">
              <span className="font-sans font-bold text-sm tracking-wider uppercase bg-background px-3 py-1 rounded-full border border-border">Sold Out</span>
            </div>
          )}
          {product.featured && product.inStock && (
            <div className="absolute top-3 left-3">
              <span className="font-sans text-xs font-bold tracking-wider uppercase bg-primary text-primary-foreground px-2 py-1 rounded-full">
                Featured
              </span>
            </div>
          )}
        </div>
        <CardContent className="p-5 flex flex-col flex-1 gap-2">
          <div className="flex justify-between items-start gap-4">
            <div>
              <h3 className="font-serif text-xl font-bold text-foreground leading-tight group-hover:text-primary transition-colors">
                {product.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                {product.description}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-mono font-bold text-primary">
                {formatPrice(product.priceKes, currency, rate)}
              </p>
            </div>
          </div>
          
          <div className="mt-auto pt-4 flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {product.category}
            </span>
            <Button
              variant={product.inStock ? "default" : "secondary"}
              size="sm"
              className="rounded-full rounded-tl-sm h-8 px-4"
              onClick={handleAdd}
              disabled={!product.inStock}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
