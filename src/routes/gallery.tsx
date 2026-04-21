import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Wheat, Loader2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { fetchGalleryItems, urlFor, type SanityGalleryItem } from "@/integrations/sanity/client";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Gallery — Clare Pastries" },
      { name: "description", content: "A glimpse of what Clare has been baking in Busia Town." },
      { property: "og:title", content: "Gallery — Clare Pastries" },
      { property: "og:description", content: "Real bakes from Clare's kitchen." },
    ],
  }),
});

function GalleryPage() {
  const [items, setItems] = useState<SanityGalleryItem[] | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchGalleryItems().then((data) => {
      if (mounted) setItems(data);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24 container-cp">
        <p className="label-eyebrow">The Bakes</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">Fresh From Our Oven.</h1>
        <p className="mt-4 text-[var(--cp-text-muted)] text-lg max-w-xl">
          Every photo here is a real bake from Clare's kitchen.
        </p>

        {items === null ? (
          <div className="mt-20 grid place-items-center">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--cp-accent)]" />
          </div>
        ) : items.length === 0 ? (
          <div className="mt-16 text-center py-20 cp-card !shadow-none border-dashed">
            <Wheat className="mx-auto text-[var(--cp-text-muted)]" size={64} />
            <p className="mt-5 font-display text-2xl">Clare is busy in the kitchen.</p>
            <p className="mt-2 text-[var(--cp-text-muted)] max-w-md mx-auto">
              The gallery will fill with real photos as orders go out. In the meantime, see what's on the menu.
            </p>
            <Link to="/menu" className="btn-cta mt-7 inline-flex">
              Browse Menu →
            </Link>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {items.map((item, i) => (
              <motion.figure
                key={item._id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="group relative overflow-hidden rounded-2xl border border-[var(--cp-border)] bg-[var(--cp-surface)]"
              >
                {item.image && (
                  <img
                    src={urlFor(item.image).width(800).height(800).fit("crop").auto("format").url()}
                    alt={item.title || "Clare Pastries bake"}
                    className="h-72 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                )}
                {(item.title || item.caption) && (
                  <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
                    {item.title && <p className="font-display text-lg">{item.title}</p>}
                    {item.caption && <p className="text-xs opacity-80 mt-0.5">{item.caption}</p>}
                  </figcaption>
                )}
              </motion.figure>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
