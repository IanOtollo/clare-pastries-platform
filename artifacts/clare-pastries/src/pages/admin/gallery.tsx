import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";

type GalleryItem = {
  id: string;
  title: string;
  category: string;
  imageUrl: string;
};

export default function AdminGallery() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["gallery-list"],
    queryFn: () => apiGet<GalleryItem[]>("/gallery"),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", category: "cakes", imageUrl: "" });

  const create = useMutation({
    mutationFn: () => apiSend("/admin/gallery", "POST", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gallery-list"] });
      setOpen(false);
      setForm({ title: "", category: "cakes", imageUrl: "" });
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiSend(`/admin/gallery/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gallery-list"] }),
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Gallery</h1>
          <p className="text-muted-foreground">{data?.length ?? 0} photos</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Upload
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {(data ?? []).map((g) => (
          <Card key={g.id} className="group relative overflow-hidden">
            <div className="aspect-square bg-muted">
              <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
            </div>
            <CardContent className="p-3">
              <div className="text-sm font-medium truncate">{g.title}</div>
              <div className="text-xs text-muted-foreground capitalize">{g.category}</div>
            </CardContent>
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => {
                if (confirm("Delete this photo?")) remove.mutate(g.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </Card>
        ))}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Add gallery photo</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <Label>Title</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Category</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                placeholder="cakes / pastries / breads / seasonal"
                required
              />
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
            {create.isError && (
              <p className="text-sm text-destructive">{(create.error as Error).message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? "Saving…" : "Add"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
