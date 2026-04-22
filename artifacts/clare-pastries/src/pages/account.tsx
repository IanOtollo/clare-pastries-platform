import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { Package, MapPin, Settings, LogOut, Heart } from "lucide-react";
import { Link } from "wouter";

export default function Account() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const user = localStorage.getItem("cp-user");
    if (user) {
      setIsLoggedIn(true);
      setEmail(user);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem("cp-user", email || "guest@example.com");
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem("cp-user");
    setIsLoggedIn(false);
    setEmail("");
  };

  if (!isLoggedIn) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-20 px-4 bg-muted/20">
          <Card className="w-full max-w-md bg-background border-border shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-serif font-bold text-foreground mb-2">Welcome Back</h1>
                <p className="text-muted-foreground">Sign in to track your orders and save favorites.</p>
              </div>

              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Register</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="you@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input id="password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full rounded-full mt-2">Sign In</Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="register">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" placeholder="Jane Doe" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">Email</Label>
                      <Input 
                        id="reg-email" 
                        type="email" 
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">Password</Label>
                      <Input id="reg-password" type="password" required />
                    </div>
                    <Button type="submit" className="w-full rounded-full mt-2">Create Account</Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="mt-8 text-center">
                <Link href="/menu">
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer border-b border-dashed border-muted-foreground hover:border-primary">
                    Continue as Guest
                  </span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
            <div>
              <h1 className="text-4xl font-serif font-bold mb-2">My Account</h1>
              <p className="text-muted-foreground">{email}</p>
            </div>
            <Button variant="outline" onClick={handleLogout} className="rounded-full">
              <LogOut className="h-4 w-4 mr-2" /> Sign Out
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-1">
              <div className="flex flex-col gap-2 sticky top-24">
                <Button variant="secondary" className="justify-start shadow-sm">
                  <Package className="mr-2 h-4 w-4" /> Order History
                </Button>
                <Button variant="ghost" className="justify-start">
                  <Heart className="mr-2 h-4 w-4" /> Favorites
                </Button>
                <Button variant="ghost" className="justify-start">
                  <MapPin className="mr-2 h-4 w-4" /> Addresses
                </Button>
                <Button variant="ghost" className="justify-start">
                  <Settings className="mr-2 h-4 w-4" /> Settings
                </Button>
              </div>
            </div>

            <div className="md:col-span-3">
              <Card className="bg-card shadow-sm border-border">
                <CardContent className="p-8 text-center py-20">
                  <Package className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-xl font-bold font-serif mb-2">No orders yet</h3>
                  <p className="text-muted-foreground mb-6">When you place an order, it will appear here.</p>
                  <Link href="/menu">
                    <Button className="rounded-full">Start Browsing</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
