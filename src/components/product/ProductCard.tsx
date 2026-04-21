import { Link } from "@tanstack/react-router";
import { ShoppingCart, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { WheatMark } from "@/components/brand/WheatMark";
import { useCart } from "@/lib/cart";
import { usePrefs } from "@/lib/preferences";
import { formatPrice, formatUGX } from "@/lib/format";

export interface ProductCardProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  price_kes: number;
  image_url: string | null;
  available: boolean;
}

export function ProductCard({ product, index = 0 }: { product: ProductCardProduct; index?: number }) {
  const add = useCart((s) => s.add);
  const currency = usePrefs((s) => s.currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="cp-card overflow-hidden flex flex-col"
    >
      <Link to="/menu/$slug" params={{ slug: product.slug }} className="block relative aspect-[16/10] bg-[var(--cp-surface-2)] overflow-hidden">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <WheatMark className="h-14 w-14 text-[var(--cp-border)]" />
          </div>
        )}
        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider bg-[var(--cp-bg)]/90 text-[var(--cp-text)] backdrop-blur">
          {product.category}
        </span>
        {!product.available && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase bg-[var(--cp-error)]/90 text-white">
            Unavailable
          </span>
        )}
      </Link>

      <div className="p-5 flex flex-col flex-1">
        <Link to="/menu/$slug" params={{ slug: product.slug }}>
          <h3 className="font-display text-xl text-[var(--cp-text)] leading-tight">{product.name}</h3>
        </Link>
        <p className="mt-1.5 text-sm text-[var(--cp-text-muted)] line-clamp-2 flex-1">{product.short_description}</p>

        <div className="mt-4 flex items-baseline gap-2">
          <span className="font-mono text-base text-[var(--cp-accent)] font-medium">
            {formatPrice(product.price_kes, currency)}
          </span>
          {currency === "KES" && (
            <span className="font-mono text-xs text-[var(--cp-text-muted)]">≈ {formatUGX(product.price_kes)}</span>
          )}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            disabled={!product.available}
            onClick={() =>
              add({
                id: product.id,
                name: product.name,
                slug: product.slug,
                price_kes: product.price_kes,
                image_url: product.image_url,
                category: product.category,
              })
            }
            className="btn-cta flex-1 text-sm py-2.5 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
          <Link
            to="/menu/$slug"
            params={{ slug: product.slug }}
            className="inline-flex items-center justify-center h-10 w-10 rounded-lg border border-[var(--cp-border)] text-[var(--cp-text-muted)] hover:text-[var(--cp-accent)] hover:border-[var(--cp-accent)] transition-colors"
            aria-label="View"
          >
            <Eye size={16} />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
