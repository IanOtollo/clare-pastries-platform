import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { apiGet } from "@/lib/api";

type Customer = {
  id: number;
  email: string;
  name: string;
  phone: string | null;
  active: boolean;
  createdAt: string;
};

export default function AdminCustomers() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "customers"],
    queryFn: () => apiGet<Customer[]>("/admin/customers"),
  });
  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Customers</h1>
      <p className="text-muted-foreground mb-6">{data?.length ?? 0} registered</p>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    Loading…
                  </td>
                </tr>
              ) : !data?.length ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No customers yet.
                  </td>
                </tr>
              ) : (
                data.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3">{c.email}</td>
                    <td className="px-4 py-3">{c.phone ?? "—"}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
