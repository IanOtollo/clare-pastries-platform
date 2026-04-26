import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "wouter";
import { useAdminStats } from "@/hooks/use-admin";
import { useRealtimeOrders } from "@/hooks/use-realtime";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function AdminDashboard() {
  const { data, isLoading } = useAdminStats();
  useRealtimeOrders();

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
            <Stat label="Customers" value={data.customers.toString()} />
            <Stat label="New Custom Orders" value={data.newCustomOrders.toString()} highlight={data.newCustomOrders > 0} />
            <Stat label="Today's Revenue" value={fmt(data.todayRevenue)} />
          </div>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Quick Links</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Link href="/admin/orders">
                  <a className="block p-3 rounded-lg border border-border hover:bg-muted/40 text-center font-medium">
                    📦 Orders
                  </a>
                </Link>
                <Link href="/admin/custom-orders">
                  <a className="block p-3 rounded-lg border border-border hover:bg-muted/40 text-center font-medium">
                    🎂 Custom Orders
                  </a>
                </Link>
                <Link href="/admin/customers">
                  <a className="block p-3 rounded-lg border border-border hover:bg-muted/40 text-center font-medium">
                    👥 Customers
                  </a>
                </Link>
                <Link href="/admin/settings">
                  <a className="block p-3 rounded-lg border border-border hover:bg-muted/40 text-center font-medium">
                    ⚙️ Settings
                  </a>
                </Link>
              </div>
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
        <div className={`text-2xl font-serif font-bold ${highlight ? "text-primary" : ""}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
