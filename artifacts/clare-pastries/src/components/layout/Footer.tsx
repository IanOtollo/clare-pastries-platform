import { Link } from "wouter";
import { Wheat, Moon, Sun, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

export function Footer() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
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

  return (
    <footer className="bg-card border-t border-border mt-auto pt-16 pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-16">
          {/* Brand Column */}
          <div className="flex flex-col items-start gap-6">
            <Link href="/">
              <span className="flex items-center gap-2 cursor-pointer group">
                <div className="bg-primary/10 p-2 rounded-full group-hover:bg-primary/20 transition-colors">
                  <Wheat className="h-6 w-6 text-primary" strokeWidth={1.5} />
                </div>
                <span className="font-serif text-2xl font-bold tracking-tight text-foreground">
                  Clare Pastries
                </span>
              </span>
            </Link>
            <p className="text-muted-foreground leading-relaxed max-w-sm">
              Handcrafted daily in Busia Town. Made with love, delivered warm to your door.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleDark}
              className="gap-2"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              Toggle {isDark ? "Light" : "Dark"} Mode
            </Button>
          </div>

          {/* Links Column */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-lg font-bold text-foreground">Quick Links</h3>
            <nav className="flex flex-col gap-3">
              <Link href="/"><span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit">Home</span></Link>
              <Link href="/menu"><span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit">Menu</span></Link>
              <Link href="/gallery"><span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit">Gallery</span></Link>
              <Link href="/about"><span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit">About</span></Link>
              <Link href="/contact"><span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit">Contact</span></Link>
              <Link href="/menu#custom-order"><span className="text-muted-foreground hover:text-primary transition-colors cursor-pointer w-fit">Custom Order</span></Link>
            </nav>
          </div>

          {/* Contact Column */}
          <div className="flex flex-col gap-4">
            <h3 className="font-serif text-lg font-bold text-foreground">Reach Clare</h3>
            <div className="flex flex-col gap-3 text-muted-foreground">
              <a href="tel:+254724848228" className="flex items-center gap-2 hover:text-primary transition-colors w-fit">
                <Phone className="h-4 w-4" />
                +254 724 848228
              </a>
              <a href="https://wa.me/254724848228" target="_blank" rel="noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors w-fit">
                <MessageCircle className="h-4 w-4" />
                WhatsApp Us
              </a>
              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm font-medium text-foreground mb-2">We Accept:</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-muted rounded">M-PESA</span>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-muted rounded">CARD</span>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-muted rounded">CASH</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Clare Pastries. All rights reserved.</p>
          <p>Handcrafted by IanOtollo at IOMTechs</p>
        </div>
      </div>
    </footer>
  );
}
