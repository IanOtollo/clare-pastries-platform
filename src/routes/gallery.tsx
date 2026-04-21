import { createFileRoute, Link } from "@tanstack/react-router";
import { Wheat } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/gallery")({
  component: GalleryPage,
  head: () => ({
    meta: [
      { title: "Gallery — Clare Pastries" },
      { name: "description", content: "A glimpse of what Clare has been baking in Busia Town." },
    ],
  }),
});

function GalleryPage() {
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24 container-cp">
        <p className="label-eyebrow">The Bakes</p>
        <h1 className="mt-3 font-display text-5xl md:text-6xl">Fresh From Our Oven.</h1>
        <p className="mt-4 text-[var(--cp-text-muted)] text-lg max-w-xl">
          Every photo here will be a real bake from Clare's kitchen.
        </p>

        <div className="mt-16 text-center py-20 cp-card !shadow-none border-dashed">
          <Wheat className="mx-auto text-[var(--cp-text-muted)]" size={64} />
          <p className="mt-5 font-display text-2xl">Clare is busy in the kitchen.</p>
          <p className="mt-2 text-[var(--cp-text-muted)] max-w-md mx-auto">
            The gallery will fill with real photos as orders go out. In the meantime, see what's on the menu.
          </p>
          <Link to="/menu" className="btn-cta mt-7 inline-flex">Browse Menu →</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
