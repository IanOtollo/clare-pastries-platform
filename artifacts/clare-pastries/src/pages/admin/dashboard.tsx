import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";
import { Link } from "wouter";

type Stats = {
  orders: { count: number; revenue: number };
  last30: { count: number; revenue: number };
  pendingOrders: number;
  products: number;
  customers: number;
  newCustomOrders: number;
  unreadMessages: number;
  recent: Array<{
    id: number;
    orderNumber: string;
    customerName: string;
    totalKes: string;
    status: string;
    createdAt: string;
  }>;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiGet<Stats>("/admin/dashboard/stats"),
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Dashboard</h1>
      <p className="text-muted-foreground mb-6">A snapshot of your bakery today.</p>

      {isLoading || !data ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Stat label="Total Orders" value={data.orders.count.toString()} />
            <Stat label="Revenue (all time)" value={fmt(data.orders.revenue)} />
            <Stat label="Last 30d Orders" value={data.last30.count.toString()} />
            <Stat label="Last 30d Revenue" value={fmt(data.last30.revenue)} />
            <Stat label="Pending Orders" value={data.pendingOrders.toString()} highlight={data.pendingOrders > 0} />
            <Stat label="Products" value={data.products.toString()} />
            <Stat label="Customers" value={data.customers.toString()} />
            <Stat label="New Custom Orders" value={data.newCustomOrders.toString()} highlight={data.newCustomOrders > 0} />
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Recent Orders</h2>
                <Link href="/admin/orders">
                  <a className="text-sm text-primary hover:underline">View all →</a>
                </Link>
              </div>
              {data.recent.length === 0 ? (
                <p className="text-sm text-muted-foreground py-8 text-center">No orders yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {data.recent.map((o) => (
                    <Link key={o.id} href={`/admin/orders/${o.id}`}>
                      <a className="flex items-center justify-between py-3 hover:bg-muted/40 -mx-2 px-2 rounded">
                        <div>
                          <div className="font-mono text-sm">{o.orderNumber}</div>
                          <div className="text-xs text-muted-foreground">
                            {o.customerName} · {new Date(o.createdAt).toLocaleString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold">{fmt(Number(o.totalKes))}</div>
                          <div className="text-xs uppercase tracking-wider text-muted-foreground">
                            {o.status}
                          </div>
                        </div>
                      </a>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </AdminLayout>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">{label}</div>
        <div className={`text-2xl font-serif font-bold ${highlight ? "text-primary" : ""}`}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
