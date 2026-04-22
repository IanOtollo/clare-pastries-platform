import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";

type Review = {
  id: number;
  author: string;
  rating: number;
  body: string;
  location: string | null;
  approved: boolean;
  createdAt: string;
};

export default function AdminReviews() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "reviews"],
    queryFn: () => apiGet<Review[]>("/admin/reviews"),
  });
  const toggle = useMutation({
    mutationFn: (vars: { id: number; approved: boolean }) =>
      apiSend(`/admin/reviews/${vars.id}`, "PATCH", { approved: vars.approved }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiSend(`/admin/reviews/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] }),
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Reviews</h1>
      <p className="text-muted-foreground mb-6">{data?.length ?? 0} customer reviews</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(data ?? []).map((r) => (
          <Card key={r.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold">{r.author}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.location ?? ""} · {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="text-sm mb-3">{r.body}</p>
              <div className="flex items-center justify-between">
                <Badge variant={r.approved ? "default" : "secondary"}>
                  {r.approved ? "Published" : "Hidden"}
                </Badge>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggle.mutate({ id: r.id, approved: !r.approved })}
                  >
                    {r.approved ? "Hide" : "Approve"}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => {
                      if (confirm("Delete this review?")) remove.mutate(r.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AdminLayout>
  );
}
