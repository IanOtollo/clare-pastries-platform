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
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdminOrders, useUpdateOrderStatus } from "@/hooks/use-admin";
import { useRealtimeOrders } from "@/hooks/use-realtime";

const STATUSES = [
  "PENDING", "CONFIRMED", "BAKING", "READY",
  "OUT_FOR_DELIVERY", "DELIVERED", "COLLECTED", "CANCELLED",
];
const PAY_STATUSES = ["UNPAID", "PAID", "REFUNDED"];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function AdminOrders() {
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading } = useAdminOrders(filter);
  const update = useUpdateOrderStatus();
  useRealtimeOrders();

  const openOrder = data?.find((o: Record<string, unknown>) => o.id === openId) ?? null;

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Orders</h1>
          <p className="text-muted-foreground">{data?.length ?? 0} orders</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">ID</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : !data?.length ? (
                <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders.</td></tr>
              ) : (
                data.map((o: Record<string, unknown>) => (
                  <tr key={o.id as string} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{String(o.id).slice(0, 8)}</td>
                    <td className="px-4 py-3">
                      <div>{(o.guestName as string) || "Registered user"}</div>
                      <div className="text-xs text-muted-foreground">{o.guestPhone as string}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">{fmt(Number(o.totalKes))}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{String(o.status).replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={o.paymentStatus === "PAID" ? "default" : "secondary"}>
                        {o.paymentStatus as string}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.createdAt as string).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(o.id as string)}>View</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={openId != null} onOpenChange={(v) => !v && setOpenId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-serif">
              Order #{openOrder ? String(openOrder.id).slice(0, 8) : ""}
            </DialogTitle>
          </DialogHeader>
          {openOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Customer</div>
                  <div>{(openOrder.guestName as string) || "Registered user"}</div>
                  <div className="text-muted-foreground">{openOrder.guestPhone as string}</div>
                  {openOrder.guestEmail && <div className="text-muted-foreground">{openOrder.guestEmail as string}</div>}
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Fulfillment</div>
                  <div>{openOrder.fulfillment as string}</div>
                  {openOrder.deliveryStreet && <div className="text-muted-foreground">{openOrder.deliveryStreet as string}</div>}
                </div>
              </div>

              {openOrder.items && (
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-2">Items</div>
                  <div className="border border-border rounded">
                    {(openOrder.items as Record<string, unknown>[]).map((it) => (
                      <div key={it.id as string} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 border-border">
                        <div>
                          <div>{it.productName as string}</div>
                          <div className="text-xs text-muted-foreground">× {it.quantity as number}</div>
                        </div>
                        <div className="font-mono">{fmt(Number(it.unitPriceKes) * Number(it.quantity))}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="font-mono text-primary">{fmt(Number(openOrder.totalKes))}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Status</label>
                  <Select
                    value={openOrder.status as string}
                    onValueChange={(v) => update.mutate({ orderId: openOrder.id as string, status: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Payment</label>
                  <Select
                    value={openOrder.paymentStatus as string}
                    onValueChange={(v) => update.mutate({ orderId: openOrder.id as string, paymentStatus: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PAY_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
