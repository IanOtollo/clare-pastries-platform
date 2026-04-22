import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiGet, apiSend } from "@/lib/api";

type Msg = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  message: string;
  read: boolean;
  createdAt: string;
};

export default function AdminMessages() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "messages"],
    queryFn: () => apiGet<Msg[]>("/admin/messages"),
  });
  const markRead = useMutation({
    mutationFn: (id: number) => apiSend(`/admin/messages/${id}`, "PATCH"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "messages"] }),
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Messages</h1>
      <p className="text-muted-foreground mb-6">{data?.length ?? 0} contact submissions</p>

      <div className="space-y-3">
        {(data ?? []).map((m) => (
          <Card key={m.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-bold">
                    {m.name}{" "}
                    {!m.read && <Badge className="ml-2">New</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {m.email ?? ""} {m.phone ?? ""} · {new Date(m.createdAt).toLocaleString()}
                  </div>
                </div>
                {!m.read && (
                  <Button size="sm" variant="outline" onClick={() => markRead.mutate(m.id)}>
                    Mark read
                  </Button>
                )}
              </div>
              <p className="text-sm whitespace-pre-wrap">{m.message}</p>
            </CardContent>
          </Card>
        ))}
        {data && data.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No messages yet.</p>
        )}
      </div>
    </AdminLayout>
  );
}
