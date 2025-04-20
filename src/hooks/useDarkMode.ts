
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "theme";
type Theme = "light" | "dark";

export function useDarkMode() {
  // Check system preference
  function getInitialTheme(): Theme {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "dark" || stored === "light") return stored;
    // Match system
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    return mq.matches ? "dark" : "light";
  }

  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const body = document.documentElement;
    if (theme === "dark") {
      body.classList.add("dark");
    } else {
      body.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggle, isDark: theme === "dark" };
}
