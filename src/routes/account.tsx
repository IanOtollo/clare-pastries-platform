import { createFileRoute, Link } from "@tanstack/react-router";
import { UserCircle2 } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

export const Route = createFileRoute("/account")({ component: AccountPage });

function AccountPage() {
  return (
    <>
      <Navbar />
      <main className="pt-28 pb-24 container-cp max-w-xl text-center">
        <UserCircle2 className="mx-auto text-[var(--cp-text-muted)]" size={64} />
        <h1 className="mt-5 font-display text-4xl">Your Account</h1>
        <p className="mt-3 text-[var(--cp-text-muted)]">
          Accounts are coming soon — for now, all orders work as guest checkout. Your cart is saved on this device.
        </p>
        <Link to="/menu" className="btn-cta mt-7 inline-flex">Browse Menu →</Link>
      </main>
      <Footer />
    </>
  );
}
