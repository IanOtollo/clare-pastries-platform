import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Wheat, ShoppingBag, UserCircle2, Menu as MenuIcon, X, Moon, Sun, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCart } from "@/store/use-cart";
import { useCurrencyStore, formatPrice, useExchangeRate } from "@/store/use-currency";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus, ArrowRight } from "lucide-react";

export function Navbar() {
  const [location] = useLocation();
  const itemCount = useCart((state) => state.itemCount);
  const { currency, toggleCurrency } = useCurrencyStore();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    if (next) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
      localStorage.setItem("cp-theme", "dark");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
      localStorage.setItem("cp-theme", "light");
    }
  };

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Menu", href: "/menu" },
    { label: "Gallery", href: "/gallery" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 border-b",
        isScrolled
          ? "bg-background/90 backdrop-blur-md border-border py-3 shadow-sm"
          : "bg-background border-transparent py-5"
      )}
    >
      <div className="container mx-auto px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden -ml-2 text-foreground">
                <MenuIcon className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] sm:w-[340px] bg-background">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Navigation for Clare Pastries</SheetDescription>
              <div className="flex flex-col h-full mt-6">
                <nav className="flex flex-col gap-4 text-lg font-medium">
                  {navItems.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <span className={cn(
                        "block px-2 py-1 transition-colors hover:text-primary",
                        location === item.href ? "text-primary font-semibold" : "text-muted-foreground"
                      )}>
                        {item.label}
                      </span>
                    </Link>
                  ))}
                  <div className="h-px bg-border my-2" />
                  <Link href="/menu#custom-order">
                    <span className="block px-2 py-1 text-muted-foreground hover:text-primary transition-colors">
                      Custom Order
                    </span>
                  </Link>
                  <a href="tel:+254724848228" className="flex items-center gap-2 px-2 py-1 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                    +254 724 848228
                  </a>
                  <a href="https://wa.me/254724848228" target="_blank" rel="noreferrer" className="flex items-center gap-2 px-2 py-1 text-muted-foreground hover:text-primary transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp Clare
                  </a>
                </nav>
                <div className="mt-auto pb-8">
                  <p className="text-sm text-muted-foreground">Handcrafted in Busia Town</p>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Link href="/">
            <span className="flex items-center gap-2 cursor-pointer group">
              <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                <Wheat className="h-5 w-5 text-primary" strokeWidth={1.5} />
              </div>
              <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
                Clare Pastries
              </span>
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-8 font-medium text-sm">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <span className={cn(
                "relative py-1 transition-colors hover:text-primary cursor-pointer",
                location === item.href ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
                {location === item.href && (
                  <span className="absolute -bottom-1 left-0 right-0 h-[2px] bg-primary rounded-full" />
                )}
              </span>
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleCurrency}
            className="font-mono text-xs font-bold hidden sm:flex px-2 w-12"
          >
            {currency}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleDark}
            className="text-muted-foreground hover:text-foreground hidden sm:flex"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Link href="/account">
            <span className="cursor-pointer">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hidden sm:flex">
                <UserCircle2 className="h-5 w-5" />
                <span className="sr-only">Account</span>
              </Button>
            </span>
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <motion.div 
                className="cursor-pointer"
                animate={itemCount > 0 ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
                key={`bag-${itemCount}`}
              >
                <Button variant="ghost" size="icon" className="relative text-foreground hover:text-primary">
                  <ShoppingBag className="h-5 w-5" />
                  <AnimatePresence mode="popLayout">
                    {itemCount > 0 && (
                      <motion.span
                        key="cart-badge"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 15 }}
                        className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-lg border border-background"
                      >
                        {itemCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  <span className="sr-only">Cart</span>
                </Button>
              </motion.div>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md p-0 flex flex-col border-l border-[var(--cp-border)] bg-[var(--cp-surface)]">
              <div className="p-6 border-b border-[var(--cp-border)]">
                <SheetTitle className="font-serif text-2xl font-bold flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Your Bag
                </SheetTitle>
                <SheetDescription className="text-sm text-muted-foreground mt-1">
                  You have {itemCount} {itemCount === 1 ? 'item' : 'items'} in your bag.
                </SheetDescription>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <MiniCartContent />
              </div>

              <div className="p-6 border-t border-[var(--cp-border)] bg-[var(--cp-surface-2)]/30 space-y-4">
                <MiniCartFooter />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

function MiniCartContent() {
  const { items, removeItem, updateQuantity } = useCart();
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-12">
        <div className="p-6 rounded-full bg-muted/50 mb-4">
          <ShoppingBag className="h-12 w-12 text-muted-foreground/30" />
        </div>
        <p className="text-lg font-serif font-bold text-foreground">Bag is empty</p>
        <p className="text-sm text-muted-foreground mt-1">Add some delicious pastries to get started!</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.product.id} className="flex gap-4">
          <div className="h-20 w-20 rounded-xl overflow-hidden border border-[var(--cp-border)] bg-[var(--cp-surface-2)] shrink-0">
            <img src={item.product.imageUrl} alt={item.product.name} className="h-full w-full object-cover" />
          </div>
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-sm font-bold truncate leading-tight">{item.product.name}</h4>
              <p className="text-sm font-mono font-bold text-primary">
                {formatPrice(item.product.priceKes * item.quantity, currency, rate)}
              </p>
            </div>
            <p className="text-[0.65rem] text-muted-foreground uppercase tracking-widest mt-0.5">{item.product.category}</p>
            
            <div className="mt-auto flex items-center justify-between">
              <div className="flex items-center border border-[var(--cp-border)] rounded-full h-7 bg-background shadow-sm">
                <button 
                  onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                  className="w-7 h-full flex items-center justify-center hover:bg-muted"
                >
                  <Minus className="h-2.5 w-2.5" />
                </button>
                <span className="w-6 text-center text-xs font-bold font-mono">{item.quantity}</span>
                <button 
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-7 h-full flex items-center justify-center hover:bg-muted"
                >
                  <Plus className="h-2.5 w-2.5" />
                </button>
              </div>
              <button 
                onClick={() => removeItem(item.product.id)}
                className="text-[0.65rem] font-bold text-destructive/80 hover:text-destructive uppercase tracking-tighter"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function MiniCartFooter() {
  const { subtotal } = useCart();
  const { currency } = useCurrencyStore();
  const { data: rate } = useExchangeRate();
  const [, setLocation] = useLocation();

  return (
    <>
      <div className="flex justify-between items-baseline">
        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Subtotal</span>
        <div className="text-right">
          <p className="text-2xl font-mono font-bold text-primary">
            {formatPrice(subtotal, currency, rate)}
          </p>
          {currency === "KES" && (
            <p className="text-[0.6rem] font-mono text-muted-foreground">≈ UGX {(subtotal * (rate || 30)).toLocaleString()}</p>
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 gap-2">
        <Button 
          onClick={() => setLocation("/checkout")}
          disabled={subtotal === 0}
          className="w-full h-12 rounded-xl font-bold bg-[var(--cp-cta)] hover:bg-[var(--cp-cta-hover)] shadow-lg shadow-primary/10"
        >
          Checkout Now <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          onClick={() => setLocation("/cart")}
          className="w-full h-10 rounded-xl text-muted-foreground text-sm"
        >
          View Full Cart
        </Button>
      </div>
    </>
  );
}


