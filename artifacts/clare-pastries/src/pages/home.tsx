

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/Layout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ui/product-card";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Truck, Smartphone, Phone, ArrowRight, Star, Quote } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFeaturedProducts } from "@/hooks/use-products";
import { Card, CardContent } from "@/components/ui/card";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?q=80&w=2000&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?q=80&w=2132&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1965&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1989&auto=format&fit=crop",
];

export default function Home() {
  const [currentImage, setCurrentImage] = useState(0);

  // Preload images
  useEffect(() => {
    HERO_IMAGES.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  // Slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: featuredProducts, isLoading: loadingFeatured } = useFeaturedProducts();

  const gallery: unknown[] = [];
  const reviews: unknown[] = [];

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex items-center pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <AnimatePresence initial={false}>
            <motion.div
              key={currentImage}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="absolute inset-0"
            >
              <img
                src={HERO_IMAGES[currentImage]}
                alt="Fresh Pastries"
                className="w-full h-full object-cover"
              />
              {/* Overlay: Darker gradient to ensure text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-transparent" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 backdrop-blur-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-xs font-bold tracking-widest uppercase">Baked in Busia · Made with Love</span>
              </div>
              
              <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground leading-[1.1]">
                Every Bite, a <span className="text-primary italic">Celebration.</span>
              </h1>
              
              <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-lg font-light">
                Handcrafted pastries, cakes, and breads. Warm from our ovens in Busia Town, delivered fresh to your door in under 90 minutes.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-4">
                <Link href="/menu">
                  <Button size="lg" className="rounded-full text-base h-12 px-8 shadow-xl shadow-primary/20">
                    Order Your First Pastry →
                  </Button>
                </Link>
                <Link href="/menu">
                  <Button variant="outline" size="lg" className="rounded-full text-base h-12 px-8 bg-background/50 backdrop-blur-sm border-border hover:bg-background">
                    Browse the Menu
                  </Button>
                </Link>
              </div>

              {/* Trust Pills */}
              <div className="flex flex-wrap gap-3 pt-8">
                {["Busia Town, Kenya", "45-90 min Delivery", "M-Pesa Accepted"].map((pill, i) => (
                  <span key={i} className="text-xs font-medium px-3 py-1.5 bg-background/60 backdrop-blur-md rounded-md border border-border/50 text-foreground/70">
                    {pill}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="border-y border-border bg-card/50">
        <div className="container mx-auto px-4 md:px-6 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 divide-x-0 md:divide-x divide-border">
            {[
              { icon: Flame, title: "Baked Fresh Daily", desc: "Never day-old" },
              { icon: Truck, title: "Busia Delivery", desc: "Fast & warm" },
              { icon: Smartphone, title: "Easy M-Pesa", desc: "Pay on phone" },
              { icon: Phone, title: "+254 724 848228", desc: "Call to order" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center px-4">
                <item.icon className="h-6 w-6 text-primary mb-3" />
                <h4 className="font-bold text-sm text-foreground">{item.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Bakes */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="max-w-xl">
              <h2 className="text-4xl md:text-5xl font-serif font-bold text-foreground mb-4">
                Fresh from the Oven.
              </h2>
              <p className="text-muted-foreground text-lg">
                Our most loved creations, handcrafted daily. Grab them before they're gone.
              </p>
            </div>
            <Link href="/menu">
              <Button variant="ghost" className="group font-medium">
                View full menu <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {loadingFeatured ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ))}
            </div>
          ) : featuredProducts?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(Array.isArray(featuredProducts)?featuredProducts:[]).slice().map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 px-4 bg-muted/30 rounded-2xl border border-dashed border-border">
              <Flame className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-serif font-bold text-foreground mb-2">Clare is warming up the oven...</h3>
              <p className="text-muted-foreground">Check back soon for today's fresh bakes.</p>
            </div>
          )}
        </div>
      </section>

      {/* Story Strip */}
      <section className="py-24 bg-card text-card-foreground border-y border-border relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">From Our Hands to Your Table</h2>
            <p className="text-muted-foreground">We believe in the magic of homemade. No shortcuts, no artificial preservatives. Just good, honest baking.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {[
              { title: "Finest Ingredients", desc: "Sourced locally where possible, chosen for quality. Real butter, fresh eggs, rich chocolate." },
              { title: "Crafted by Hand", desc: "Every dough is kneaded, folded, and shaped by hand. You can taste the care in every layer." },
              { title: "Fresh to Your Door", desc: "Baked to order and delivered while still warm. The bakery experience, brought home." }
            ].map((step, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className="relative text-center"
              >
                <div className="text-8xl font-serif font-bold text-primary/10 absolute top-0 left-1/2 -translate-x-1/2 -translate-y-6 -z-10 select-none">
                  0{i + 1}
                </div>
                <h3 className="text-xl font-bold mb-3">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews (Conditional) */}
      {reviews && reviews.length > 0 && (
        <section className="py-24 bg-background">
          <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl md:text-4xl font-serif font-bold mb-12">Loved in Busia</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {(Array.isArray(reviews)?reviews:[]).slice().map((review) => (
                <Card key={review.id} className="bg-card/50 border-none shadow-sm">
                  <CardContent className="p-8">
                    <Quote className="h-8 w-8 text-primary/20 mb-4" />
                    <div className="flex gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-primary text-primary' : 'text-muted'}`} />
                      ))}
                    </div>
                    <p className="text-foreground/80 italic mb-6">"{review.body}"</p>
                    <div>
                      <p className="font-bold text-foreground">{review.author}</p>
                      {review.location && <p className="text-xs text-muted-foreground">{review.location}</p>}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Final CTA */}
      <section className="py-32 bg-primary text-primary-foreground relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1558961363-fa8fdf82db35?q=80&w=1965')] bg-cover bg-center mix-blend-overlay"></div>
        <div className="container relative z-10 mx-auto px-4 md:px-6 text-center max-w-3xl">
          <h2 className="text-4xl md:text-6xl font-serif font-bold mb-6">Ready to Taste Clare's Best?</h2>
          <p className="text-primary-foreground/80 text-lg mb-10">
            Whether it's a quiet morning coffee or a grand celebration, we have something sweet waiting for you.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/menu">
              <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-base w-full sm:w-auto">
                Browse the Menu
              </Button>
            </Link>
            <Link href="/menu#custom-order">
              <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary w-full sm:w-auto">
                Request Custom Order
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}
