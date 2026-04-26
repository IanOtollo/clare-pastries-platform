import { Link, useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Wheat, ShoppingBag, UserCircle2, Menu as MenuIcon, X, Moon, Sun, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useCart } from "@/store/use-cart";
import { useCurrencyStore } from "@/store/use-currency";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

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

          <Link href="/cart">
            <motion.span 
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
            </motion.span>
          </Link>
        </div>
      </div>
    </header>
  );
}
