import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Menu from "@/pages/menu";
import Gallery from "@/pages/gallery";
import About from "@/pages/about";
import Contact from "@/pages/contact";
import Cart from "@/pages/cart";
import Account from "@/pages/account";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOrders from "@/pages/admin/orders";
import AdminPOS from "@/pages/admin/pos";
import AdminProducts from "@/pages/admin/products";
import AdminGallery from "@/pages/admin/gallery";
import AdminCustomers from "@/pages/admin/customers";
import AdminCustomOrders from "@/pages/admin/custom-orders";
import AdminMessages from "@/pages/admin/messages";
import AdminReviews from "@/pages/admin/reviews";
import AdminOffers from "@/pages/admin/offers";
import AdminAnalytics from "@/pages/admin/analytics";
import AdminStaff from "@/pages/admin/staff";
import AdminSettings from "@/pages/admin/settings";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/menu" component={Menu} />
      <Route path="/gallery" component={Gallery} />
      <Route path="/about" component={About} />
      <Route path="/contact" component={Contact} />
      <Route path="/cart" component={Cart} />
      <Route path="/account" component={Account} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/orders/:id" component={AdminOrders} />
      <Route path="/admin/pos" component={AdminPOS} />
      <Route path="/admin/products" component={AdminProducts} />
      <Route path="/admin/gallery" component={AdminGallery} />
      <Route path="/admin/customers" component={AdminCustomers} />
      <Route path="/admin/custom-orders" component={AdminCustomOrders} />
      <Route path="/admin/messages" component={AdminMessages} />
      <Route path="/admin/reviews" component={AdminReviews} />
      <Route path="/admin/offers" component={AdminOffers} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/staff" component={AdminStaff} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base="">
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
