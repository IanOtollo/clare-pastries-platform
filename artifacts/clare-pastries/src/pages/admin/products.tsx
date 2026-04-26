import { useState, useRef } from "react";
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
import { Plus, Pencil, Trash2, UploadCloud, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string;
  short_description: string;
  price_kes: number;
  category: string;
  image_url: string;
  featured: boolean;
  available: boolean;
};

const CATEGORIES = ["cakes", "pastries", "breads", "seasonal"];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

const empty = {
  slug: "",
  name: "",
  description: "",
  short_description: "",
  price_kes: 0,
  category: "pastries",
  image_url: "",
  featured: false,
  available: true,
};

export default function AdminProducts() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as ProductRow[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image. Make sure you are an admin.');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        short_description: form.short_description,
        price_kes: Number(form.price_kes),
        category: form.category,
        image_url: form.image_url,
        featured: form.featured,
        available: form.available,
      };

      if (editing) {
        const { error } = await supabase.from('products').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      setOpen(false);
      setEditing(null);
      setForm({ ...empty });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const openEdit = (p: ProductRow) => {
    setEditing(p);
    setForm({
      slug: p.slug,
      name: p.name,
      description: p.description,
      short_description: p.short_description,
      price_kes: p.price_kes,
      category: p.category,
      image_url: p.image_url,
      featured: p.featured,
      available: p.available,
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
                        <img src={p.image_url || 'https://placehold.co/100'} alt="" className="h-10 w-10 rounded object-cover" />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 capitalize">{p.category}</td>
                    <td className="px-4 py-3 font-mono">{fmt(p.price_kes)}</td>
                    <td className="px-4 py-3 space-x-1">
                      {p.featured && <Badge>Featured</Badge>}
                      {!p.available && <Badge variant="destructive">Out of stock</Badge>}
                      {p.available && !p.featured && <Badge variant="secondary">In stock</Badge>}
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
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            className="space-y-4"
          >
            {/* Image Upload Area */}
            <div>
              <Label className="mb-2 block">Product Image</Label>
              <div className="flex items-center gap-4">
                {form.image_url ? (
                  <img src={form.image_url} alt="Preview" className="h-20 w-20 object-cover rounded-md border" />
                ) : (
                  <div className="h-20 w-20 bg-muted rounded-md flex items-center justify-center border border-dashed">
                    <UploadCloud className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Uploading...</> : 'Choose Image'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input
                  value={form.name}
                  onChange={(e) => {
                     const name = e.target.value;
                     // Auto-generate slug if not editing
                     const slug = editing ? form.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                     setForm((f) => ({ ...f, name, slug }));
                  }}
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
              <Label>Short Description (Used in cards)</Label>
              <Input
                value={form.short_description}
                onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Full Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Price (KES)</Label>
                <Input
                  type="number"
                  value={form.price_kes}
                  onChange={(e) => setForm((f) => ({ ...f, price_kes: Number(e.target.value) }))}
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
                  checked={form.available}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, available: v }))}
                />
                Available (In Stock)
              </label>
            </div>
            {save.isError && (
              <p className="text-sm text-destructive">{(save.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending || uploading}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
