import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet, apiSend } from "@/lib/api";
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

type Order = {
  id: number;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string | null;
  fulfillment: string;
  address: string | null;
  notes: string | null;
  totalKes: string;
  subtotalKes: string;
  deliveryKes: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  channel: string;
  createdAt: string;
};
type OrderItem = {
  id: number;
  name: string;
  imageUrl: string | null;
  priceKes: string;
  quantity: number;
};

const STATUSES = [
  "pending",
  "confirmed",
  "baking",
  "ready",
  "out_for_delivery",
  "delivered",
  "cancelled",
];
const PAY_STATUSES = ["pending", "paid", "failed", "refunded"];

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function AdminOrders() {
  const [filter, setFilter] = useState<string>("all");
  const [openId, setOpenId] = useState<number | null>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "orders", filter],
    queryFn: () =>
      apiGet<Order[]>(`/admin/orders${filter === "all" ? "" : `?status=${filter}`}`),
  });

  const detailQ = useQuery({
    queryKey: ["admin", "order", openId],
    queryFn: () => apiGet<{ order: Order; items: OrderItem[] }>(`/admin/orders/${openId}`),
    enabled: openId != null,
  });

  const update = useMutation({
    mutationFn: (vars: { id: number; status?: string; paymentStatus?: string }) =>
      apiSend(`/admin/orders/${vars.id}`, "PATCH", {
        status: vars.status,
        paymentStatus: vars.paymentStatus,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
      qc.invalidateQueries({ queryKey: ["admin", "order"] });
      qc.invalidateQueries({ queryKey: ["admin", "dashboard"] });
    },
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Orders</h1>
          <p className="text-muted-foreground">{data?.length ?? 0} orders</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {s.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Order</th>
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
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : !data?.length ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No orders.
                  </td>
                </tr>
              ) : (
                data.map((o) => (
                  <tr key={o.id} className="border-t border-border hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono">{o.orderNumber}</td>
                    <td className="px-4 py-3">
                      <div>{o.customerName}</div>
                      <div className="text-xs text-muted-foreground">{o.phone}</div>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">{fmt(Number(o.totalKes))}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{o.status.replace(/_/g, " ")}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={o.paymentStatus === "paid" ? "default" : "secondary"}>
                        {o.paymentStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(o.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button size="sm" variant="outline" onClick={() => setOpenId(o.id)}>
                        View
                      </Button>
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
              Order {detailQ.data?.order.orderNumber ?? ""}
            </DialogTitle>
          </DialogHeader>
          {detailQ.data && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Customer</div>
                  <div>{detailQ.data.order.customerName}</div>
                  <div className="text-muted-foreground">{detailQ.data.order.phone}</div>
                  {detailQ.data.order.email && (
                    <div className="text-muted-foreground">{detailQ.data.order.email}</div>
                  )}
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Fulfillment</div>
                  <div>{detailQ.data.order.fulfillment}</div>
                  {detailQ.data.order.address && (
                    <div className="text-muted-foreground">{detailQ.data.order.address}</div>
                  )}
                </div>
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Items</div>
                <div className="border border-border rounded">
                  {detailQ.data.items.map((it) => (
                    <div
                      key={it.id}
                      className="flex items-center justify-between px-3 py-2 border-b last:border-b-0 border-border"
                    >
                      <div>
                        <div>{it.name}</div>
                        <div className="text-xs text-muted-foreground">× {it.quantity}</div>
                      </div>
                      <div className="font-mono">
                        {fmt(Number(it.priceKes) * it.quantity)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="font-mono text-primary">
                  {fmt(Number(detailQ.data.order.totalKes))}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs uppercase text-muted-foreground">Status</label>
                  <Select
                    value={detailQ.data.order.status}
                    onValueChange={(v) =>
                      update.mutate({ id: detailQ.data!.order.id, status: v })
                    }
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
                  <label className="text-xs uppercase text-muted-foreground">Payment</label>
                  <Select
                    value={detailQ.data.order.paymentStatus}
                    onValueChange={(v) =>
                      update.mutate({ id: detailQ.data!.order.id, paymentStatus: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAY_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
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
