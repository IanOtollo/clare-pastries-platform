import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";
import { apiGet } from "@/lib/api";

type Analytics = {
  daily: Array<{ day: string; orders: number; revenue: number }>;
  byCategory: Array<{ category: string | null; items: number; revenue: number }>;
  topProducts: Array<{ name: string; qty: number; revenue: number }>;
};

const fmt = (n: number) =>
  new Intl.NumberFormat("en-KE", { style: "currency", currency: "KES", maximumFractionDigits: 0 }).format(n);

export default function AdminAnalytics() {
  const { data } = useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => apiGet<Analytics>("/admin/analytics"),
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Analytics</h1>
      <p className="text-muted-foreground mb-6">Last 30 days</p>

      {!data ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold mb-4">Daily Revenue</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.daily}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold mb-4">Revenue by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.byCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <h3 className="font-bold mb-4">Top Products</h3>
              <table className="w-full text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="py-2">Product</th>
                    <th className="py-2 text-right">Quantity</th>
                    <th className="py-2 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topProducts.map((p as any) => (
                    <tr key={p.name} className="border-t border-border">
                      <td className="py-2">{p.name}</td>
                      <td className="py-2 text-right">{p.qty}</td>
                      <td className="py-2 text-right font-mono">{fmt(p.revenue)}</td>
                    </tr>
                  ))}
                  {data.topProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-muted-foreground">
                        No sales yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
}
