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

import { Layout } from "@/components/layout/Layout";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useListGallery } from "@workspace/api-client-react";

export default function Gallery() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: gallery, isLoading } = useListGallery({
    category: activeCategory !== "All" ? activeCategory.toLowerCase() : undefined
  });

  const categories = ["All", "Cakes", "Pastries", "Behind the Scenes", "Events"];

  return (
    <Layout>
      <div className="pt-20 pb-32">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-4">Fresh From Our Oven.</h1>
            <p className="text-lg text-muted-foreground font-light">A visual diary of our daily bakes, special orders, and the hands that make them.</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {(Array.isArray(categories)?categories:[]).map((cat) => (
              <Button
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                onClick={() => setActiveCategory(cat)}
                className="rounded-full"
              >
                {cat}
              </Button>
            ))}
          </div>

          {isLoading ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="break-inside-avoid">
                  <Skeleton className="w-full rounded-2xl" style={{ height: `${Math.floor(Math.random() * 200) + 200}px` }} />
                </div>
              ))}
            </div>
          ) : gallery && gallery.length > 0 ? (
            <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
              <AnimatePresence>
                {(Array.isArray(gallery)?gallery:[]).map((item, i) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="break-inside-avoid relative group rounded-2xl overflow-hidden bg-muted"
                  >
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                      <span className="text-primary font-bold text-xs uppercase tracking-wider mb-1">{item.category}</span>
                      <h3 className="text-foreground font-serif text-xl font-bold mb-3">{item.title}</h3>
                      
                      {item.productId && (
                        <Link href={`/menu`}>
                          <Button size="sm" variant="secondary" className="w-fit rounded-full">
                            Order This <ExternalLink className="ml-2 h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-32 px-4 bg-muted/30 rounded-3xl border border-dashed border-border">
              <Camera className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-foreground mb-2">No photos here yet</h3>
              <p className="text-muted-foreground">We're busy baking! Check back soon for more photos.</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
