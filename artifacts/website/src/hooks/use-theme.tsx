import { useEffect, useState, useCallback } from "react";

type Theme = "dark" | "light" | "system";

function resolveSystem(): "dark" | "light" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("theme") as Theme) || "system";
  });

  /* Apply theme class to <html> */
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme === "system" ? resolveSystem() : theme);
  }, [theme]);

  /* Listen for device theme changes when in system mode */
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const root = window.document.documentElement;
      root.classList.remove("light", "dark");
      root.classList.add(resolveSystem());
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const setAndSaveTheme = useCallback((t: Theme) => {
    setTheme(t);
    localStorage.setItem("theme", t);
  }, []);

  return { theme, setTheme: setAndSaveTheme };
}
