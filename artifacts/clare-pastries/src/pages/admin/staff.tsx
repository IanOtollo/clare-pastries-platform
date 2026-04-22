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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";
import { apiGet, apiSend } from "@/lib/api";

type Staff = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: "ADMIN" | "STAFF";
  active: boolean;
  createdAt: string;
};
type Role = {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
};

export default function AdminStaff() {
  const qc = useQueryClient();
  const { data: staff } = useQuery({
    queryKey: ["admin", "staff"],
    queryFn: () => apiGet<Staff[]>("/admin/staff"),
  });
  const { data: roles } = useQuery({
    queryKey: ["admin", "roles"],
    queryFn: () => apiGet<Role[]>("/admin/roles"),
  });
  const [open, setOpen] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF" as "ADMIN" | "STAFF",
    phone: "",
  });
  const [roleForm, setRoleForm] = useState({
    name: "",
    description: "",
    permissions: "",
  });
  const create = useMutation({
    mutationFn: () => apiSend("/admin/staff", "POST", form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "staff"] });
      setOpen(false);
      setForm({ name: "", email: "", password: "", role: "STAFF", phone: "" });
    },
  });
  const remove = useMutation({
    mutationFn: (id: number) => apiSend(`/admin/staff/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "staff"] }),
  });
  const createRole = useMutation({
    mutationFn: () =>
      apiSend("/admin/roles", "POST", {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions
          .split(",")
          .map((p: any) => p.trim())
          .filter(Boolean),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "roles"] });
      setOpenRole(false);
      setRoleForm({ name: "", description: "", permissions: "" });
    },
  });
  const removeRole = useMutation({
    mutationFn: (id: number) => apiSend(`/admin/roles/${id}`, "DELETE"),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "roles"] }),
  });

  return (
    <AdminLayout>
      <h1 className="text-3xl font-serif font-bold mb-1">Staff & Roles</h1>
      <p className="text-muted-foreground mb-6">
        Manage who has access to the admin area.
      </p>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Team Members</h2>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Add Staff
        </Button>
      </div>

      <Card className="mb-8">
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(staff ?? []).map((s) => (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3">{s.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.role === "ADMIN" ? "default" : "secondary"}>
                      {s.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{s.active ? "Active" : "Disabled"}</td>
                  <td className="px-4 py-3">
                    {s.role !== "ADMIN" || (staff ?? []).filter((x) => x.role === "ADMIN").length > 1 ? (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => {
                          if (confirm(`Disable ${s.name}?`)) remove.mutate(s.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold">Custom Roles</h2>
        <Button variant="outline" onClick={() => setOpenRole(true)}>
          <Plus className="h-4 w-4 mr-2" /> New Role
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Permissions</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {(roles ?? []).map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="px-4 py-3 font-bold">{r.name}</td>
                  <td className="px-4 py-3">{r.description ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(r.permissions ?? []).map((p: any) => (
                        <Badge key={p} variant="outline">
                          {p}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => {
                        if (confirm(`Delete ${r.name}?`)) removeRole.mutate(r.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
              {roles && roles.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No custom roles yet. Built-in: ADMIN, STAFF.
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
            <DialogTitle className="font-serif">Add Staff Member</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Password (min 6 chars)</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select
                  value={form.role}
                  onValueChange={(v) => setForm((f) => ({ ...f, role: v as "ADMIN" | "STAFF" }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="STAFF">STAFF</SelectItem>
                    <SelectItem value="ADMIN">ADMIN</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Phone</Label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
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

      <Dialog open={openRole} onOpenChange={setOpenRole}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">New Role</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createRole.mutate();
            }}
            className="space-y-3"
          >
            <div>
              <Label>Name</Label>
              <Input
                value={roleForm.name}
                onChange={(e) => setRoleForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                value={roleForm.description}
                onChange={(e) => setRoleForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div>
              <Label>Permissions (comma separated)</Label>
              <Input
                value={roleForm.permissions}
                onChange={(e) => setRoleForm((f) => ({ ...f, permissions: e.target.value }))}
                placeholder="orders.view, products.edit"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpenRole(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createRole.isPending}>
                Create
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
