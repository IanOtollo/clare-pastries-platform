import { create } from "zustand";
import { persist } from "zustand/middleware";

interface PrefState {
  currency: "KES" | "UGX";
  theme: "light" | "dark";
  visitCount: number;
  cookieConsent: "accepted" | "declined" | null;
  setCurrency: (c: "KES" | "UGX") => void;
  setTheme: (t: "light" | "dark") => void;
  bumpVisit: () => void;
  setCookieConsent: (v: "accepted" | "declined") => void;
}

export const usePrefs = create<PrefState>()(
  persist(
    (set) => ({
      currency: "KES",
      theme: "light",
      visitCount: 0,
      cookieConsent: null,
      setCurrency: (currency) => set({ currency }),
      setTheme: (theme) => {
        if (typeof document !== "undefined") document.documentElement.setAttribute("data-theme", theme);
        set({ theme });
      },
      bumpVisit: () => set((s) => ({ visitCount: s.visitCount + 1 })),
      setCookieConsent: (cookieConsent) => set({ cookieConsent }),
    }),
    { name: "cp-prefs-v1" }
  )
);
