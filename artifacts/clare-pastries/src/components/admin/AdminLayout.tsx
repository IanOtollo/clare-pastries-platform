import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth, useLogout } from "@/store/use-auth";
import {
  LayoutDashboard,
  ShoppingCart,
  Calculator,
  Package,
  Image as ImageIcon,
  Users,
  Sparkles,
  Star,
  MessageSquare,
  Tag,
  BarChart3,
  UserCog,
  Settings,
  LogOut,
  Wheat,
} from "lucide-react";

const navItems: { href: string; label: string; icon: typeof LayoutDashboard }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/pos", label: "POS", icon: Calculator },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/gallery", label: "Gallery", icon: ImageIcon },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/custom-orders", label: "Custom Orders", icon: Sparkles },
  { href: "/admin/reviews", label: "Reviews", icon: Star },
  { href: "/admin/messages", label: "Messages", icon: MessageSquare },
  { href: "/admin/offers", label: "Offers", icon: Tag },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/admin/staff", label: "Staff & Roles", icon: UserCog },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const logout = useLogout();
  const [location, navigate] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (!user) {
    navigate("/account");
    return null;
  }

  if (user.role !== "ADMIN" && user.role !== "STAFF") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-3xl font-serif font-bold mb-2">Unauthorized</h1>
        <p className="text-muted-foreground mb-6">
          You don&apos;t have access to the admin area.
        </p>
        <Link href="/">
          <a className="text-primary hover:underline">Back to storefront</a>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex bg-muted/30">
      <aside className="w-64 bg-background border-r border-border flex flex-col">
        <div className="p-5 border-b border-border">
          <Link href="/admin">
            <a className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-full bg-primary/15 flex items-center justify-center">
                <Wheat className="h-5 w-5 text-primary" />
              </div>
              <div>
                <div className="font-serif font-bold text-base leading-tight">
                  Clare Pastries
                </div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Admin
                </div>
              </div>
            </a>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin"
                ? location === "/admin"
                : location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={`flex items-center gap-3 px-5 py-2 text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium"
                      : "text-foreground/70 hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground mb-2">{user.email}</div>
          <button
            onClick={() => {
              logout.mutate(undefined, { onSuccess: () => navigate("/") });
            }}
            className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 overflow-x-auto">
        <div className="px-8 py-6 max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
