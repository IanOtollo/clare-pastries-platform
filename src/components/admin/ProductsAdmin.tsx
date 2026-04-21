import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Plus, Pencil, Trash2, Eye, EyeOff, X, ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatKES } from "@/lib/format";

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  short_description: string;
  description: string;
  price_kes: number;
  image_url: string | null;
  available: boolean;
  featured: boolean;
  ingredients: string[];
  allergens: string[];
}

type Draft = Omit<AdminProduct, "id">;

const EMPTY_DRAFT: Draft = {
  name: "",
  slug: "",
  category: "Pastries",
  short_description: "",
  description: "",
  price_kes: 0,
  image_url: "",
  available: true,
  featured: false,
  ingredients: [],
  allergens: [],
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60);
}

export function ProductsAdmin() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("category", { ascending: true })
      .order("name", { ascending: true });
    if (error) console.error(error);
    setProducts((data ?? []) as AdminProduct[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleAvailable(p: AdminProduct) {
    const { error } = await supabase
      .from("products")
      .update({ available: !p.available })
      .eq("id", p.id);
    if (error) return alert(error.message);
    load();
  }

  async function remove(p: AdminProduct) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from("products").delete().eq("id", p.id);
    if (error) return alert(error.message);
    load();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl">Products ({products.length})</h2>
        <button
          onClick={() => setEditing("new")}
          className="btn-cta inline-flex items-center gap-2"
        >
          <Plus size={16} /> New product
        </button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--cp-accent)]" />
        </div>
      ) : products.length === 0 ? (
        <p className="text-center py-12 text-[var(--cp-text-muted)]">No products yet.</p>
      ) : (
        <div className="space-y-2">
          {products.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-4 bg-[var(--cp-surface)] border border-[var(--cp-border)] rounded-xl p-3"
            >
              <div className="h-14 w-14 rounded-lg overflow-hidden bg-[var(--cp-surface-2)] grid place-items-center shrink-0">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon size={20} className="text-[var(--cp-text-muted)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{p.name}</p>
                <p className="text-xs text-[var(--cp-text-muted)] font-mono">
                  {p.category} · {formatKES(p.price_kes)}
                </p>
              </div>
              <span
                className={[
                  "text-[10px] font-mono px-2 py-1 rounded-full uppercase",
                  p.available
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-red-500/15 text-red-400",
                ].join(" ")}
              >
                {p.available ? "Live" : "Hidden"}
              </span>
              <button
                onClick={() => toggleAvailable(p)}
                className="p-2 rounded-lg hover:bg-[var(--cp-surface-2)]"
                title={p.available ? "Hide" : "Show"}
              >
                {p.available ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
              <button
                onClick={() => setEditing(p)}
                className="p-2 rounded-lg hover:bg-[var(--cp-surface-2)]"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => remove(p)}
                className="p-2 rounded-lg hover:bg-red-500/15 text-red-400"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {editing && (
          <ProductEditor
            product={editing === "new" ? null : editing}
            onClose={() => setEditing(null)}
            onSaved={() => {
              setEditing(null);
              load();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function ProductEditor({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(() =>
    product ? { ...product } : { ...EMPTY_DRAFT }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const slug = draft.slug.trim() || slugify(draft.name);
      const payload = {
        name: draft.name.trim(),
        slug,
        category: draft.category.trim() || "Pastries",
        short_description: draft.short_description.trim(),
        description: draft.description.trim(),
        price_kes: Math.max(0, Math.round(draft.price_kes)),
        image_url: draft.image_url?.trim() || null,
        available: draft.available,
        featured: draft.featured,
        ingredients: draft.ingredients.filter(Boolean),
        allergens: draft.allergens.filter(Boolean),
      };
      if (!payload.name) throw new Error("Name is required.");
      if (payload.price_kes < 0) throw new Error("Price must be ≥ 0.");

      if (product) {
        const { error } = await supabase.from("products").update(payload).eq("id", product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
      }
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm grid place-items-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 20, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-[var(--cp-bg)] border border-[var(--cp-border)] rounded-2xl w-full max-w-2xl my-8"
      >
        <div className="flex items-center justify-between p-5 border-b border-[var(--cp-border)]">
          <h3 className="font-display text-2xl">{product ? "Edit product" : "New product"}</h3>
          <button onClick={onClose} className="p-2 hover:bg-[var(--cp-surface-2)] rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <Field label="Name *">
            <input
              className={inputCls}
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Slug (auto if blank)">
              <input
                className={inputCls}
                value={draft.slug}
                onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                placeholder={slugify(draft.name)}
              />
            </Field>
            <Field label="Category">
              <input
                className={inputCls}
                value={draft.category}
                onChange={(e) => setDraft({ ...draft, category: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Short description">
            <input
              className={inputCls}
              value={draft.short_description}
              onChange={(e) => setDraft({ ...draft, short_description: e.target.value })}
            />
          </Field>
          <Field label="Description">
            <textarea
              className={inputCls}
              rows={3}
              value={draft.description}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Price (KES)">
              <input
                type="number"
                min={0}
                className={inputCls}
                value={draft.price_kes}
                onChange={(e) => setDraft({ ...draft, price_kes: Number(e.target.value) })}
              />
            </Field>
            <Field label="Image URL">
              <input
                className={inputCls}
                value={draft.image_url ?? ""}
                onChange={(e) => setDraft({ ...draft, image_url: e.target.value })}
                placeholder="https://…"
              />
            </Field>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Ingredients (comma-separated)">
              <input
                className={inputCls}
                value={draft.ingredients.join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    ingredients: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </Field>
            <Field label="Allergens (comma-separated)">
              <input
                className={inputCls}
                value={draft.allergens.join(", ")}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    allergens: e.target.value.split(",").map((s) => s.trim()),
                  })
                }
              />
            </Field>
          </div>

          <div className="flex items-center gap-6 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.available}
                onChange={(e) => setDraft({ ...draft, available: e.target.checked })}
              />
              Available
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.featured}
                onChange={(e) => setDraft({ ...draft, featured: e.target.checked })}
              />
              Featured
            </label>
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-[var(--cp-border)]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-[var(--cp-border)] hover:bg-[var(--cp-surface-2)]"
          >
            Cancel
          </button>
          <button onClick={save} disabled={saving} className="btn-cta disabled:opacity-50">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save product"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const inputCls =
  "w-full px-3.5 py-2.5 rounded-lg bg-[var(--cp-bg)] border border-[var(--cp-border)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--cp-accent)]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs font-mono uppercase tracking-wider text-[var(--cp-text-muted)] mb-1.5 block">
        {label}
      </span>
      {children}
    </label>
  );
}
