import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Minus, Trash2, CheckCircle2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  category: string;
  imageUrl: string;
  priceKes: number;
  inStock: boolean;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function AdminPOS() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["products-admin"],
    queryFn: () => apiGet<Product[]>("/products"),
  });
  const [cart, setCart] = useState<Record<number, number>>({});
  const [name, setName] = useState("Walk-in customer");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mpesa" | "card">("cash");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  const items = (products ?? [])
    .map((p: any) => ({ p, q: cart[Number(p.id)] ?? 0 }))
    .filter(({ q }) => q > 0);
  const total = items.reduce((s, { p, q }) => s + p.priceKes * q, 0);

  const submit = useMutation({
    mutationFn: () =>
      apiSend<{ order: { orderNumber: string } }>("/admin/pos/orders", "POST", {
        customerName: name,
        phone,
        paymentMethod,
        items: items.map(({ p, q }) => ({ productId: Number(p.id), quantity: q })),
      }),
    onSuccess: (data) => {
      setCart({});
      setConfirmation(data.order.orderNumber);
      qc.invalidateQueries({ queryKey: ["admin"] });
    },
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Point of Sale</h1>
      <p className="text-muted-foreground mb-6">Quick in-store sales.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {(products ?? []).map((p: any) => {
              const id = Number(p.id);
              const q = cart[id] ?? 0;
              return (
                <Card
                  key={p.id}
                  className={`cursor-pointer transition-all ${q > 0 ? "ring-2 ring-primary" : ""}`}
                  onClick={() => setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }))}
                >
                  <div className="aspect-square bg-muted">
                    <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                  </div>
                  <CardContent className="p-3">
                    <div className="text-sm font-bold leading-tight">{p.name}</div>
                    <div className="text-xs text-muted-foreground capitalize">{p.category}</div>
                    <div className="font-mono text-sm font-bold text-primary mt-1">
                      {fmt(p.priceKes)}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        <Card className="sticky top-6 h-fit">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-lg">Current Sale</h3>
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Tap a product to add it.</p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {items.map(({ p, q }) => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <div className="flex-1">
                      <div className="font-medium">{p.name}</div>
                      <div className="text-xs text-muted-foreground">{fmt(p.priceKes)} each</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() =>
                          setCart((c) => ({ ...c, [Number(p.id)]: Math.max(0, q - 1) }))
                        }
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{q}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7"
                        onClick={() => setCart((c) => ({ ...c, [Number(p.id)]: q + 1 }))}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 text-destructive"
                        onClick={() =>
                          setCart((c) => {
                            const n = { ...c };
                            delete n[Number(p.id)];
                            return n;
                          })
                        }
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="font-mono text-primary">{fmt(total)}</span>
            </div>
            <div className="space-y-2">
              <div>
                <Label>Customer name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <Label>Phone (optional)</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div>
                <Label>Payment</Label>
                <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as typeof paymentMethod)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              size="lg"
              disabled={items.length === 0 || submit.isPending}
              onClick={() => submit.mutate()}
            >
              {submit.isPending ? "Saving…" : "Complete Sale"}
            </Button>
            {confirmation && (
              <div className="bg-primary/10 text-primary p-3 rounded text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Sale recorded: {confirmation}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
