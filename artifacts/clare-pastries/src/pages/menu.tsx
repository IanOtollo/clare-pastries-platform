

import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { ProductCard } from "@/components/ui/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Search, Flame, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useListProducts } from "@/hooks/use-products";
import { supabase } from "@/lib/supabase";

const categories = ["All", "Cakes", "Pastries", "Breads", "Seasonal"];
const sorts = ["Featured", "Price Low→High", "Price High→Low"];

const customOrderSchema = z.object({
  fullName: z.string().min(2, "Name is required"),
  phone: z.string().min(9, "Valid phone number required"),
  email: z.string().email().optional().or(z.literal("")),
  occasion: z.string().min(1, "Please select an occasion"),
  description: z.string().min(10, "Please describe what you'd like"),
  servings: z.string().optional(),
  preferredDate: z.string().optional(),
  budget: z.string().optional(),
  fulfillment: z.enum(["delivery", "pickup"]),
});

type CustomOrderFormValues = z.infer<typeof customOrderSchema>;

export default function Menu() {
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSort, setActiveSort] = useState("Featured");
  const [searchQuery, setSearchQuery] = useState("");

  const { data: products, isLoading } = useListProducts({
    category: activeCategory !== "All" ? activeCategory.toLowerCase() : undefined
  });

  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const createOrder = {
    isPending: submitting,
    mutate: async (data: CustomOrderFormValues, opts?: { onSuccess?: () => void; onError?: () => void }) => {
      setSubmitting(true);
      try {
        const orderId = crypto.randomUUID();
        const { error } = await supabase.from('CustomOrder').insert({
          id: orderId,
          fullName: data.fullName,
          phone: data.phone,
          email: data.email || null,
          occasion: data.occasion,
          description: data.description,
          flavors: null,
          servings: data.servings || null,
          preferredDate: data.preferredDate || null,
          fulfillment: data.fulfillment,
          deliveryArea: null,
          budgetRange: data.budget || null,
          notes: null,
          status: 'NEW',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        if (error) throw error;
        
        const baseUrl = typeof window !== 'undefined' && window.location.hostname === 'localhost' 
          ? 'https://clarepastries-pearl.vercel.app' 
          : '';

        fetch(`${baseUrl}/api/notify-order`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isCustomOrder: true,
            orderId: orderId,
            customerName: data.fullName,
            customerPhone: data.phone,
            occasion: data.occasion,
            description: data.description,
            budget: data.budget,
            fulfillment: data.fulfillment
          })
        }).then(res => res.json()).then(console.log).catch(console.error);

        opts?.onSuccess?.();
      } catch (err) { 
        console.error("Custom Order Error:", err);
        opts?.onError?.(); 
      }
      finally { setSubmitting(false); }
    }
  };

  const form = useForm<CustomOrderFormValues>({
    resolver: zodResolver(customOrderSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      occasion: "",
      description: "",
      budget: "",
      fulfillment: "delivery",
    }
  });

  const onSubmit = (data: CustomOrderFormValues) => {
    createOrder.mutate(data, {
      onSuccess: () => {
        toast({
          title: "Order Request Sent!",
          description: "Clare will contact you shortly to confirm details.",
        });
        form.reset();
      },
      onError: () => {
        toast({
          title: "Something went wrong",
          description: "Please try again or call us directly.",
          variant: "destructive",
        });
      }
    });
  };

  let displayedProducts = products || [];
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    displayedProducts = displayedProducts.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.shortDescription && p.shortDescription.toLowerCase().includes(q))
    );
  }

  if (activeSort === "Price Low→High") {
    displayedProducts = [...displayedProducts].sort((a, b) => a.priceKes - b.priceKes);
  } else if (activeSort === "Price High→Low") {
    displayedProducts = [...displayedProducts].sort((a, b) => b.priceKes - a.priceKes);
  } else {
    // Featured first
    displayedProducts = [...displayedProducts].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }

  // Out of stock last
  displayedProducts = [...displayedProducts].sort((a, b) => (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0));

  return (
    <Layout>
      <div className="bg-muted/30 pt-12 pb-20">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-5xl md:text-6xl font-serif font-bold text-foreground mb-4">The Menu.</h1>
            <p className="text-lg text-muted-foreground font-light">Handcrafted daily in Busia. We bake in small batches to ensure everything reaches you fresh and warm.</p>
          </div>

          {/* Filters Bar */}
          <div className="sticky top-20 z-40 bg-background/80 backdrop-blur-xl border border-border p-4 rounded-2xl shadow-sm mb-12 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex overflow-x-auto pb-2 md:pb-0 w-full md:w-auto hide-scrollbar gap-2">
              {(Array.isArray(categories)?categories:[]).map((cat) => (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  onClick={() => setActiveCategory(cat)}
                  className="rounded-full whitespace-nowrap"
                  size="sm"
                >
                  {cat}
                </Button>
              ))}
            </div>

            <div className="flex w-full md:w-auto gap-3 items-center">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search pastries..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 rounded-full bg-background"
                />
              </div>
              <Select value={activeSort} onValueChange={setActiveSort}>
                <SelectTrigger className="w-[140px] rounded-full bg-background hidden sm:flex">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  {(Array.isArray(sorts)?sorts:[]).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Product Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="space-y-4">
                  <Skeleton className="w-full aspect-square rounded-xl" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : displayedProducts.length > 0 ? (
            <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {(Array.isArray(displayedProducts)?displayedProducts:[]).map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </AnimatePresence>
            </motion.div>
          ) : (
            <div className="text-center py-32 px-4">
              <Flame className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
              <h3 className="text-2xl font-serif font-bold text-foreground mb-2">No bakes found</h3>
              <p className="text-muted-foreground mb-6">Try adjusting your filters or search term.</p>
              <Button variant="outline" onClick={() => { setActiveCategory("All"); setSearchQuery(""); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Custom Order Section */}
      <section id="custom-order" className="py-24 bg-card border-t border-border">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-serif font-bold mb-4">Request a Custom Order</h2>
              <p className="text-muted-foreground">Birthdays, weddings, or just a large batch of your favorites. Tell us what you need, and Clare will bake it happen.</p>
            </div>

            <div className="bg-background p-6 md:p-10 rounded-3xl border border-border shadow-sm">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="fullName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Jane Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <span className="inline-flex items-center px-3 border border-r-0 border-input bg-muted text-muted-foreground text-sm rounded-l-md">
                                +254
                              </span>
                              <Input className="rounded-l-none" placeholder="712 345 678" {...field} />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="jane@example.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="occasion"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Occasion</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select occasion" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="birthday">Birthday</SelectItem>
                              <SelectItem value="wedding">Wedding</SelectItem>
                              <SelectItem value="corporate">Corporate Event</SelectItem>
                              <SelectItem value="bulk">Bulk Order (Stock up)</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="preferredDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>What would you like?</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe your dream cake, flavors, allergies, or specific pastry requests..." 
                            className="min-h-[120px] resize-y"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="servings"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estimated Servings</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="e.g. 12" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="budget"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Budget Range (KES)</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select budget" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="under-2000">Under 2,000</SelectItem>
                              <SelectItem value="2000-5000">2,000 - 5,000</SelectItem>
                              <SelectItem value="5000-10000">5,000 - 10,000</SelectItem>
                              <SelectItem value="10000-plus">10,000+</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="fulfillment"
                    render={({ field }) => (
                      <FormItem className="space-y-3">
                        <FormLabel>How will you get your order?</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
                          >
                            <FormItem className="flex">
                              <FormControl>
                                <RadioGroupItem value="delivery" id="delivery" className="peer sr-only" />
                              </FormControl>
                              <Label htmlFor="delivery" className="flex flex-1 flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                <span className="font-bold text-base mb-1">Delivery</span>
                                <span className="text-sm text-muted-foreground font-normal">Within Busia Town</span>
                              </Label>
                            </FormItem>
                            <FormItem className="flex">
                              <FormControl>
                                <RadioGroupItem value="pickup" id="pickup" className="peer sr-only" />
                              </FormControl>
                              <Label htmlFor="pickup" className="flex flex-1 flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer">
                                <span className="font-bold text-base mb-1">Pickup</span>
                                <span className="text-sm text-muted-foreground font-normal">At our kitchen</span>
                              </Label>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" size="lg" className="w-full text-base h-12 rounded-full" disabled={createOrder.isPending}>
                    {createOrder.isPending ? (
                      <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Sending Request...</>
                    ) : "Submit Custom Order Request"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground mt-4">
                    No payment required yet. Clare will contact you to confirm details and provide a quote.
                  </p>
                </form>
              </Form>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
