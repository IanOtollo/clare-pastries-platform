import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminCustomers } from "@/hooks/use-admin";

export default function AdminCustomers() {
  const { data, isLoading } = useAdminCustomers();

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
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Joined</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">Loading…</td></tr>
              ) : !data?.length ? (
                <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No customers yet.</td></tr>
              ) : (
                (data as Record<string, unknown>[]).map((c) => (
                  <tr key={c.id as string} className="border-t border-border">
                    <td className="px-4 py-3 font-medium">{(c.name as string) || "—"}</td>
                    <td className="px-4 py-3">{c.email as string}</td>
                    <td className="px-4 py-3">{(c.phone as string) ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border font-mono">
                        {c.role as string}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(c.createdAt as string).toLocaleDateString()}
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
