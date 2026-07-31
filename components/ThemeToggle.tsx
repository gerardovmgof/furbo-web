"use client";

import { useEffect, useState } from "react";
import { THEME_STORAGE_KEY } from "@/lib/theme";

type Theme = "light" | "dark";

// El valor inicial real ya lo puso el script anti-flash de app/layout.tsx
// (o el default "dark" del <html> si no había preferencia guardada) antes
// de que React hidrate. Leemos data-theme del DOM en vez de asumir "dark"
// para que el estado de este botón arranque de acuerdo con lo que el
// usuario ya está viendo.
function readCurrentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    setTheme(readCurrentTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Safari en modo privado (u otras restricciones de storage): el
      // toggle sigue funcionando para esta sesión, solo no persiste.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 transition hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200"
    >
      {theme === "dark" ? "☀️ Modo claro" : "🌙 Modo oscuro"}
    </button>
  );
}
