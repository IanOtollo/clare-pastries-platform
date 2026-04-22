import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";

type Product = {
  id: string;
  slug: string;
  name: string;
  description: string;
  priceKes: number;
  category: string;
  imageUrl: string;
  featured: boolean;
  inStock: boolean;
  servings?: string | null;
};

const CATEGORIES = ["cakes", "pastries", "breads", "seasonal"];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const empty = {
  slug: "",
  name: "",
  description: "",
  priceKes: 0,
  category: "pastries",
  imageUrl: "",
  featured: false,
  inStock: true,
  servings: "",
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["products-list"],
    queryFn: () => apiGet<Product[]>("/products"),
  });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [form, setForm] = useState({ ...empty });

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        ...form,
        priceKes: Number(form.priceKes),
        servings: form.servings || null,
      };
      return editing
        ? apiSend(`/admin/products/${editing.id}`, "PATCH", payload)
        : apiSend(`/admin/products`, "POST", payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products-list"] });
      setOpen(false);
      setEditing(null);
      setForm({ ...empty });
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => apiSend(`/admin/products/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products-list"] }),
  });

  const openEdit = (p: Product) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      name: p.name,
      description: p.description,
      priceKes: p.priceKes,
      category: p.category,
      imageUrl: p.imageUrl,
      featured: p.featured,
      inStock: p.inStock,
      servings: p.servings ?? "",
    });
    setOpen(true);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Products</h1>
          <p className="text-muted-foreground">{data?.length ?? 0} items</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ ...empty });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> New Product
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td>
                </tr>
              ) : (
                (data ?? []).map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img src={p.imageUrl} alt="" className="h-10 w-10 rounded object-cover" />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{p.category}</td>
                    <td className="px-4 py-3 font-mono">{fmt(p.priceKes)}</td>
                    <td className="px-4 py-3 space-x-1">
                      {p.featured && <Badge>Featured</Badge>}
                      {!p.inStock && <Badge variant="destructive">Out of stock</Badge>}
                      {p.inStock && !p.featured && <Badge variant="secondary">In stock</Badge>}
                    </td>
                    <td className="px-4 py-3 flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Delete ${p.name}?`)) remove.mutate(p.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing ? "Edit Product" : "New Product"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Price (KES)</Label>
                <Input
                  type="number"
                  value={form.priceKes}
                  onChange={(e) => setForm((f) => ({ ...f, priceKes: Number(e.target.value) }))}
                  required
                />
              </div>
              <div>
                <Label>Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Servings</Label>
                <Input
                  value={form.servings}
                  onChange={(e) => setForm((f) => ({ ...f, servings: e.target.value }))}
                  placeholder="e.g. 8-10"
                />
              </div>
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={form.imageUrl}
                onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
                placeholder="https://..."
                required
              />
            </div>
            <div className="flex items-center gap-6 pt-2">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.featured}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
                />
                Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.inStock}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, inStock: v }))}
                />
                In stock
              </label>
            </div>
            {save.isError && (
              <p className="text-sm text-destructive">{(save.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
