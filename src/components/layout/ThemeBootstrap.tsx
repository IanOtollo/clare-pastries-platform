import { useEffect } from "react";
import { detectSeason } from "@/lib/seasonal";
import { usePrefs } from "@/lib/preferences";

export function ThemeBootstrap() {
  const theme = usePrefs((s) => s.theme);
  const bumpVisit = usePrefs((s) => s.bumpVisit);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    const { season } = detectSeason();
    document.documentElement.setAttribute("data-season", season);
    bumpVisit();
  }, [bumpVisit]);

  return null;
}
