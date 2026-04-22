import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiGet, apiSend } from "@/lib/api";

type Settings = {
  business?: {
    name?: string;
    address?: string;
    phone?: string;
    whatsapp?: string;
    email?: string;
    deliveryFeeKes?: number;
    deliveryRadiusKm?: number;
    paybillNumber?: string;
    paybillAccount?: string;
    hours?: string;
  };
};

const defaults: Required<NonNullable<Settings["business"]>> = {
  name: "Clare Pastries",
  address: "Busia Town, Kenya",
  phone: "+254 724 848228",
  whatsapp: "254724848228",
  email: "hello@clarepastries.co.ke",
  deliveryFeeKes: 200,
  deliveryRadiusKm: 5,
  paybillNumber: "714888",
  paybillAccount: "257457",
  hours: "Mon–Sat 7:30am–7pm · Sun 9am–5pm",
};

export default function AdminSettings() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => apiGet<Settings>("/admin/settings"),
  });
  const [form, setForm] = useState({ ...defaults });

  useEffect(() => {
    if (data?.business) setForm({ ...defaults, ...data.business });
  }, [data]);

  const save = useMutation({
    mutationFn: () => apiSend("/admin/settings", "PUT", { business: form }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "settings"] }),
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Settings</h1>
      <p className="text-muted-foreground mb-6">Bakery information shown across the site.</p>

      <Card className="max-w-2xl">
        <CardContent className="p-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              save.mutate();
            }}
            className="space-y-4"
          >
            <div>
              <Label>Business name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
              <div>
                <Label>WhatsApp number</Label>
                <Input
                  value={form.whatsapp}
                  onChange={(e) => setForm((f) => ({ ...f, whatsapp: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Delivery fee (KES)</Label>
                <Input
                  type="number"
                  value={form.deliveryFeeKes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deliveryFeeKes: Number(e.target.value) }))
                  }
                />
              </div>
              <div>
                <Label>Delivery radius (km)</Label>
                <Input
                  type="number"
                  value={form.deliveryRadiusKm}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, deliveryRadiusKm: Number(e.target.value) }))
                  }
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>M-Pesa Paybill</Label>
                <Input
                  value={form.paybillNumber}
                  onChange={(e) => setForm((f) => ({ ...f, paybillNumber: e.target.value }))}
                />
              </div>
              <div>
                <Label>Paybill Account</Label>
                <Input
                  value={form.paybillAccount}
                  onChange={(e) => setForm((f) => ({ ...f, paybillAccount: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label>Opening hours</Label>
              <Input
                value={form.hours}
                onChange={(e) => setForm((f) => ({ ...f, hours: e.target.value }))}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              {save.isSuccess && <span className="text-sm text-primary">Saved.</span>}
              <Button type="submit" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
