import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, UploadCloud, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type GalleryRow = {
  id: string;
  title: string;
  category: string;
  caption: string;
  image_url: string;
  product_slug: string;
  featured: boolean;
};

const empty = {
  title: "",
  category: "cakes",
  caption: "",
  image_url: "",
  product_slug: "",
  featured: false,
};

export default function AdminGallery() {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data, isLoading } = useQuery({
    queryKey: ["admin-gallery"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gallery_images").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as GalleryRow[];
    },
  });

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<GalleryRow | null>(null);
  const [form, setForm] = useState({ ...empty });
  const [uploading, setUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('images').getPublicUrl(filePath);
      setForm(f => ({ ...f, image_url: data.publicUrl }));
    } catch (err) {
      console.error('Error uploading image:', err);
      alert('Failed to upload image.');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: async () => {
      const payload = { ...form };

      if (editing) {
        const { error } = await supabase.from('gallery_images').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('gallery_images').insert([payload]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
      setOpen(false);
      setEditing(null);
      setForm({ ...empty });
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('gallery_images').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-gallery"] });
      qc.invalidateQueries({ queryKey: ["gallery"] });
    },
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Gallery</h1>
          <p className="text-muted-foreground">{data?.length ?? 0} images</p>
        </div>
        <Button
          onClick={() => {
            setEditing(null);
            setForm({ ...empty });
            setOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" /> Add Image
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
           <div className="col-span-full p-8 text-center text-muted-foreground">Loading…</div>
        ) : (
          (data ?? []).map((img) => (
            <Card key={img.id} className="overflow-hidden group">
              <div className="aspect-square relative">
                <img src={img.image_url} alt={img.title} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button size="icon" variant="secondary" onClick={() => {
                    setEditing(img);
                    setForm({
                      title: img.title,
                      category: img.category,
                      caption: img.caption || '',
                      image_url: img.image_url,
                      product_slug: img.product_slug || '',
                      featured: img.featured,
                    });
                    setOpen(true);
                  }}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => {
                    if (confirm(`Delete ${img.title}?`)) remove.mutate(img.id);
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="p-3">
                <div className="font-medium truncate">{img.title}</div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-xs text-muted-foreground capitalize">{img.category}</span>
                  {img.featured && <Badge className="text-[10px]">Featured</Badge>}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">
              {editing ? "Edit Gallery Image" : "Add Gallery Image"}
            </DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label className="mb-2 block">Upload Image</Label>
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

            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Category</Label>
                <Input
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label>Link to Product (Slug)</Label>
                <Input
                  value={form.product_slug}
                  onChange={(e) => setForm((f) => ({ ...f, product_slug: e.target.value }))}
                  placeholder="e.g. chocolate-cake"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <Switch
                checked={form.featured}
                onCheckedChange={(v) => setForm((f) => ({ ...f, featured: v }))}
              />
              <Label>Featured on Home Page</Label>
            </div>
            
            {save.isError && (
              <p className="text-sm text-destructive">{(save.error as Error).message}</p>
            )}
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={save.isPending || uploading || !form.image_url}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
