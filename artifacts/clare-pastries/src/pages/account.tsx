import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Package, MapPin, Settings, LogOut, Eye, EyeOff } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useAuth, useLogin, useLogout, useRegister } from "@/store/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import { useCurrencyStore, formatPrice, useExchangeRate } from "@/store/use-currency";

type Order = {
  id: number;
  orderNumber: string;
  totalKes: string;
  status: string;
  paymentStatus: string;
  fulfillment: string;
  createdAt: string;
};

export default function Account() {
  const { user, loading } = useAuth();
  const [, navigate] = useLocation();
  const login = useLogin();
  const register = useRegister();
  const logout = useLogout();
  const [showPwd, setShowPwd] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPwd, setLoginPwd] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPwd, setRegPwd] = useState("");

  useEffect(() => {
    if (user?.role === "ADMIN" || user?.role === "STAFF") {
      navigate("/admin");
    }
  }, [user, navigate]);

  const ordersQuery = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => apiGet<Order[]>("/orders/me"),
    enabled: !!user && user.role === "CUSTOMER",
  });
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();

  if (loading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-32">
          <p className="text-muted-foreground">Loading…</p>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-20 px-4 bg-muted/20">
          <Card className="w-full max-w-md bg-background border-border shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">Sign in to track your orders.</p>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      login.mutate(
                        { email: loginEmail, password: loginPwd },
                        {
                          onSuccess: (data) => {
                            if (data.user.role === "ADMIN" || data.user.role === "STAFF") {
                              navigate("/admin");
                            }
                          },
                        },
                      );
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="you@example.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-pwd">Password</Label>
                      <div className="relative">
                        <Input
                          id="login-pwd"
                          type={showPwd ? "text" : "password"}
                          value={loginPwd}
                          onChange={(e) => setLoginPwd(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPwd((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                        >
                          {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {login.isError && (
                      <p className="text-sm text-destructive">{(login.error as Error).message}</p>
                    )}
                    <Button
                      type="submit"
                      className="w-full rounded-full mt-2"
                      disabled={login.isPending}
                    >
                      {login.isPending ? "Signing in…" : "Sign In"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      register.mutate({ name: regName, email: regEmail, password: regPwd });
                    }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name</Label>
                      <Input
                        id="reg-name"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-pwd">Password</Label>
                      <Input
                        id="reg-pwd"
                        type="password"
                        value={regPwd}
                        onChange={(e) => setRegPwd(e.target.value)}
                        minLength={6}
                        required
                      />
                    </div>
                    {register.isError && (
                      <p className="text-sm text-destructive">{(register.error as Error).message}</p>
                    )}
                    <Button
                      type="submit"
                      className="w-full rounded-full mt-2"
                      disabled={register.isPending}
                    >
                      {register.isPending ? "Creating…" : "Create Account"}
                    </Button>
                    <p className="text-xs text-center text-muted-foreground">
                      Guest checkout always available.
                    </p>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-8 text-center">
                <Link href="/menu">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer border-b border-dashed border-muted-foreground hover:border-primary">
                    Continue as Guest →
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  const orders = ordersQuery.data ?? [];

  return (
    <Layout>
      <div className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold mb-2">My Account</h1>
              <p className="text-muted-foreground">{user.email}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => logout.mutate()}
              className="rounded-full"
            >
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex flex-col gap-2 sticky top-24">
                <Button variant="secondary" className="justify-start shadow-sm">
                  <Package className="mr-2 h-4 w-4" /> Order History
                </Button>
                <Button variant="ghost" className="justify-start" disabled>
                  <MapPin className="mr-2 h-4 w-4" /> Addresses
                </Button>
                <Button variant="ghost" className="justify-start" disabled>
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
              </div>
            </div>

            <div className="md:col-span-3">
              <Card className="bg-card shadow-sm border-border">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold font-serif mb-6">Your Orders</h3>
                  {orders.length === 0 ? (
                    <div className="text-center py-12">
                      <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                      <h4 className="text-lg font-bold font-serif mb-2">No orders yet</h4>
                      <p className="text-muted-foreground mb-6">
                        When you place an order, it will appear here.
                      </p>
                      <Link href="/menu">
                        <Button className="rounded-full">Start Browsing</Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      {orders.map((o) => (
                        <div key={o.id} className="py-4 flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm">{o.orderNumber}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(o.createdAt).toLocaleString()} · {o.fulfillment}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-mono font-bold">
                              {formatPrice(Number(o.totalKes), currency, rate)}
                            </p>
                            <p className="text-xs uppercase tracking-wider text-muted-foreground">
                              {o.status} · {o.paymentStatus}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
