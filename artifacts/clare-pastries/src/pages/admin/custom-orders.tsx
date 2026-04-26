import { useState } from "react";
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
import { useAdminCustomOrders, useUpdateCustomOrder } from "@/hooks/use-admin";

const STATUSES = ["NEW", "REVIEWING", "QUOTED", "APPROVED", "IN_PRODUCTION", "DELIVERED", "CANCELLED"];

export default function AdminCustomOrders() {
  const { data } = useAdminCustomOrders();
  const update = useUpdateCustomOrder();
  const [openId, setOpenId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const open = (data as Record<string, unknown>[] | undefined)?.find((o) => o.id === openId) ?? null;

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
              {((data ?? []) as Record<string, unknown>[]).map((o) => (
                <tr key={o.id as string} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium">{o.fullName as string}</div>
                    <div className="text-xs text-muted-foreground">{o.phone as string}</div>
                  </td>
                  <td className="px-4 py-3 capitalize">{o.occasion as string}</td>
                  <td className="px-4 py-3 text-xs">{(o.preferredDate as string) ?? "—"}</td>
                  <td className="px-4 py-3">{(o.budgetRange as string) ?? (o.budget as string) ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{String(o.status).replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm" variant="outline"
                      onClick={() => { setOpenId(o.id as string); setNotes((o.adminNotes as string) ?? ""); }}
                    >View</Button>
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
                  <div>{open.fullName as string}</div>
                  <div className="text-muted-foreground">{open.phone as string}</div>
                  {open.email && <div className="text-muted-foreground">{open.email as string}</div>}
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Occasion</div>
                  <div className="capitalize">{open.occasion as string}</div>
                  <div className="text-muted-foreground">
                    {open.servings ? `Serves ${open.servings}` : ""}
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs uppercase text-muted-foreground">Description</div>
                <p className="whitespace-pre-wrap">{open.description as string}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <div className="uppercase text-muted-foreground">Date</div>
                  <div>{(open.preferredDate as string) ?? "—"}</div>
                </div>
                <div>
                  <div className="uppercase text-muted-foreground">Budget</div>
                  <div>{(open.budgetRange as string) ?? (open.budget as string) ?? "—"}</div>
                </div>
                <div>
                  <div className="uppercase text-muted-foreground">Fulfillment</div>
                  <div className="capitalize">{open.fulfillment as string}</div>
                </div>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Status</label>
                <Select
                  value={open.status as string}
                  onValueChange={(v) => update.mutate({ id: open.id as string, status: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs uppercase text-muted-foreground">Internal notes</label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                <Button
                  size="sm" className="mt-2"
                  onClick={() => update.mutate({ id: open.id as string, adminNotes: notes })}
                  disabled={update.isPending}
                >Save notes</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
