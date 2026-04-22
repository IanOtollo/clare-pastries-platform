import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiGet, apiSend } from "@/lib/api";

type CustomOrder = {
  id: number;
  fullName: string;
  phone: string;
  email: string | null;
  occasion: string;
  description: string;
  servings: number | null;
  preferredDate: string | null;
  budget: string | null;
  fulfillment: string;
  status: string;
  adminNotes: string | null;
  createdAt: string;
};

const STATUSES = [
  "new",
  "reviewing",
  "quoted",
  "approved",
  "in_production",
  "delivered",
  "cancelled",
];

export default function AdminCustomOrders() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "custom-orders"],
    queryFn: () => apiGet<CustomOrder[]>("/admin/custom-orders"),
  });
  const [openId, setOpenId] = useState<number | null>(null);
  const [notes, setNotes] = useState("");

  const update = useMutation({
    mutationFn: (vars: { id: number; status?: string; adminNotes?: string }) =>
      apiSend(`/admin/custom-orders/${vars.id}`, "PATCH", {
        status: vars.status,
        adminNotes: vars.adminNotes,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "custom-orders"] }),
  });

  const open = data?.find((o) => o.id === openId) ?? null;

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Custom Orders</h1>
      <p className="text-muted-foreground mb-6">{data?.length ?? 0} requests</p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Occasion</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.fullName}</div>
                    <div className="text-xs text-muted-foreground">{o.phone}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{o.occasion}</td>
                  <td className="px-4 py-3 text-xs">{o.preferredDate ?? "—"}</td>
                  <td className="px-4 py-3">{o.budget ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{o.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setOpenId(o.id);
                        setNotes(o.adminNotes ?? "");
                      }}
                    >
                      View
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={openId != null} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif">Custom Order Request</DialogTitle>
          </DialogHeader>
          {open && (
            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Customer</div>
                  <div>{open.fullName}</div>
                  <div className="text-muted-foreground">{open.phone}</div>
                  {open.email && <div className="text-muted-foreground">{open.email}</div>}
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Occasion</div>
                  <div className="capitalize">{open.occasion}</div>
                  <div className="text-muted-foreground">
                    {open.servings ? `Serves ${open.servings}` : ""}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Description</div>
                <p className="whitespace-pre-wrap">{open.description}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="uppercase text-muted-foreground">Date</div>
                  <div>{open.preferredDate ?? "—"}</div>
                </div>
                <div>
                  <div className="uppercase text-muted-foreground">Budget</div>
                  <div>{open.budget ?? "—"}</div>
                </div>
                <div>
                  <div className="uppercase text-muted-foreground">Fulfillment</div>
                  <div className="capitalize">{open.fulfillment}</div>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Status</label>
                <Select
                  value={open.status}
                  onValueChange={(v) => update.mutate({ id: open.id, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Internal notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                <Button
                  size="sm"
                  className="mt-2"
                  onClick={() => update.mutate({ id: open.id, adminNotes: notes })}
                  disabled={update.isPending}
                >
                  Save notes
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
