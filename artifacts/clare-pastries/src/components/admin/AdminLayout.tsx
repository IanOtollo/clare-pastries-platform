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
  Menu,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState } from "react";

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
  const { user, role, isLoading: loading } = useAuth();
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

  if (role !== "ADMIN" && role !== "STAFF") {
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

  const [open, setOpen] = useState(false);

  const SidebarContent = () => (
    <div className="h-full flex flex-col bg-background">
      <div className="p-5 border-b border-border">
        <Link href="/admin">
          <a className="flex items-center gap-2" onClick={() => setOpen(false)}>
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
                onClick={() => setOpen(false)}
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
    </div>
  );

  return (
    <div className="min-h-[100dvh] flex flex-col lg:flex-row bg-muted/30">
      {/* Mobile Header */}
      <header className="lg:hidden h-16 border-b border-border bg-background flex items-center justify-between px-4 sticky top-0 z-50">
        <Link href="/admin">
          <a className="flex items-center gap-2">
            <Wheat className="h-6 w-6 text-primary" />
            <span className="font-serif font-bold">Clare Admin</span>
          </a>
        </Link>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-background border-r border-border flex-col sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="px-4 py-6 md:px-8 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
