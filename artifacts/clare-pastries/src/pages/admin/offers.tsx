import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";

type Offer = {
  id: number;
  code: string;
  label: string;
  discountType: "percent" | "amount";
  discountValue: string;
  minSubtotalKes: string;
  active: boolean;
};

export default function AdminOffers() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "offers"],
    queryFn: () => apiGet<Offer[]>("/admin/offers"),
  });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: "",
    label: "",
    discountType: "percent" as "percent" | "amount",
    discountValue: 10,
    minSubtotalKes: 0,
    active: true,
  });
  const create = useMutation({
    mutationFn: () => apiSend("/admin/offers", "POST", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "offers"] });
      setOpen(false);
      setForm({
        code: "",
        label: "",
        discountType: "percent",
        discountValue: 10,
        minSubtotalKes: 0,
        active: true,
      });
    },
  });
  const toggle = useMutation({
    mutationFn: (vars: { id: number; active: boolean }) =>
      apiSend(`/admin/offers/${vars.id}`, "PATCH", { active: vars.active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "offers"] }),
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiSend(`/admin/offers/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "offers"] }),
  });

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-serif font-bold">Offers</h1>
          <p className="text-muted-foreground">{data?.length ?? 0} discount codes</p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Offer
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Label</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Min Subtotal</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(data ?? []).map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono font-bold">{o.code}</td>
                  <td className="px-4 py-3">{o.label}</td>
                  <td className="px-4 py-3">
                    {o.discountType === "percent"
                      ? `${o.discountValue}%`
                      : `KES ${o.discountValue}`}
                  </td>
                  <td className="px-4 py-3">KES {o.minSubtotalKes}</td>
                  <td className="px-4 py-3">
                    <Badge variant={o.active ? "default" : "secondary"}>
                      {o.active ? "Active" : "Off"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    <Switch
                      checked={o.active}
                      onCheckedChange={(v) => toggle.mutate({ id: o.id, active: v })}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete ${o.code}?`)) remove.mutate(o.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {data && data.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    No offers yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">New Offer</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-3"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  placeholder="WELCOME10"
                  required
                />
              </div>
              <div>
                <Label>Label</Label>
                <Input
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Welcome 10% off"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select
                  value={form.discountType}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, discountType: v as "percent" | "amount" }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Percent</SelectItem>
                    <SelectItem value="amount">Amount (KES)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Value</Label>
                <Input
                  type="number"
                  value={form.discountValue}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))
                  }
                  required
                />
              </div>
            </div>
            <div>
              <Label>Min subtotal (KES)</Label>
              <Input
                type="number"
                value={form.minSubtotalKes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, minSubtotalKes: Number(e.target.value) }))
                }
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
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
