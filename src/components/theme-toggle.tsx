"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "momentum-theme";
type Theme = "light" | "dark" | "system";

function systemPrefersDark() {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? false;
}

function applyTheme(theme: Theme) {
  const isDark =
    theme === "dark" || (theme === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", isDark);
}

export function ThemeToggle() {
  const [theme, setTheme] = React.useState<Theme>("system");
  const [isDarkUI, setIsDarkUI] = React.useState(false);

  React.useEffect(() => {
    const stored =
      (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? "system";
    setTheme(stored);
    applyTheme(stored);
    setIsDarkUI(document.documentElement.classList.contains("dark"));
  }, []);

  React.useEffect(() => {
    if (theme !== "system") return;

    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      applyTheme("system");
      setIsDarkUI(document.documentElement.classList.contains("dark"));
    };

    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [theme]);

  function toggle() {
    // Keep it simple: toggle between light/dark (ignores system)
    const next: Theme = isDarkUI ? "light" : "dark";
    setTheme(next);
    localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
    setIsDarkUI(!isDarkUI);
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-xl"
    >
      {isDarkUI ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
