import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Wheat, MapPin, Phone, MessageCircle } from "lucide-react";
import { Link } from "wouter";

export default function About() {
  return (
    <Layout>
      {/* Hero */}
      <section className="relative py-24 md:py-32 bg-card overflow-hidden">
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none bg-[url('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80')] bg-cover bg-left mask-image-linear-left"></div>
        <div className="container relative z-10 mx-auto px-4 md:px-6">
          <div className="max-w-3xl">
            <span className="text-primary font-bold tracking-wider uppercase text-sm mb-4 block">Our Story</span>
            <h1 className="text-5xl md:text-7xl font-serif font-bold text-foreground mb-8 leading-tight">
              The Hands Behind <br/>
              <span className="text-primary italic">Clare Pastries.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed">
              What started as a small kitchen experiment in Busia Town has grown into a community staple. But the recipe remains the same: real ingredients, no shortcuts, and a whole lot of love.
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6 text-lg text-foreground/80 leading-relaxed font-light">
              <p>
                Clare didn't start out to build a bakery empire. She just wanted to make bread that tasted like the bread her grandmother used to make — dense, flavorful, and honest.
              </p>
              <p>
                When neighbors started asking to buy loaves, Clare Pastries was quietly born. Today, we still operate from Busia, delivering warm pastries, custom cakes, and daily bread to homes and offices across town.
              </p>
              <p>
                We believe that good food is a celebration of life. That's why we never use artificial preservatives or premade mixes. Every croissant is folded by hand, every cake is frosted with care, and every delivery is made with a smile.
              </p>
              <div className="pt-6">
                <img src="https://images.unsplash.com/photo-1556206079-a715fbc741fb?q=80&w=2000" alt="Baking process" className="rounded-2xl w-full h-64 object-cover shadow-sm" />
              </div>
            </div>

            <div className="space-y-8">
              {[
                { icon: Heart, title: "Made with Love", desc: "We pour our heart into every recipe. Baking isn't just a job; it's our love language to the community." },
                { icon: Wheat, title: "Fresh Daily", desc: "Our ovens start before sunrise. We bake in small batches so everything you get is at its absolute best." },
                { icon: MapPin, title: "Proudly Local", desc: "Born in Busia, baking for Busia. We source local ingredients whenever possible to support our neighbors." }
              ].map((pillar, i) => (
                <div key={i} className="flex gap-6">
                  <div className="shrink-0 mt-1">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <pillar.icon className="h-6 w-6" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif mb-2 text-foreground">{pillar.title}</h3>
                    <p className="text-muted-foreground">{pillar.desc}</p>
                  </div>
                </div>
              ))}

              <Card className="mt-12 bg-primary text-primary-foreground border-none">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-serif font-bold mb-4">Come Find Us</h3>
                  <p className="mb-6 opacity-90">We operate a delivery-first model in Busia Town, but we love hearing from you. Call us to place an order or just to talk pastries.</p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <a href="tel:+254724848228" className="flex-1">
                      <Button variant="secondary" className="w-full gap-2 rounded-full">
                        <Phone className="h-4 w-4" /> Call Now
                      </Button>
                    </a>
                    <a href="https://wa.me/254724848228" target="_blank" rel="noreferrer" className="flex-1">
                      <Button variant="outline" className="w-full gap-2 rounded-full bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                        <MessageCircle className="h-4 w-4" /> WhatsApp
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
