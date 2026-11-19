import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Theme = "dark" | "light";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.dataset["theme"] = theme;
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  root.classList.add("theme-transition");
  try {
    localStorage.setItem("rylestate-theme", theme);
  } catch {
    // The theme remains active for this session when storage is unavailable.
  }
  window.setTimeout(() => root.classList.remove("theme-transition"), 320);
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(document.documentElement.dataset["theme"] === "light" ? "light" : "dark");
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const label = `Switch to ${nextTheme === "light" ? "Light" : "Dark"} Mode`;

  return (
    <button
      type="button"
      onClick={() => {
        applyTheme(nextTheme);
        setTheme(nextTheme);
      }}
      aria-label={label}
      title={label}
      aria-pressed={theme === "light"}
      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-border bg-elevated text-foreground transition-colors hover:border-primary/50 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {theme === "dark" ? (
        <Sun className="theme-toggle-icon h-4.5 w-4.5" aria-hidden="true" />
      ) : (
        <Moon className="theme-toggle-icon h-4.5 w-4.5" aria-hidden="true" />
      )}
      <span className="sr-only">{label}</span>
    </button>
  );
}
