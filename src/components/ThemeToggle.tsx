"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    setDark((current) => {
      const next = !current;
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("engeserv-theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white ${className}`}
      aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
      title={dark ? "Modo claro" : "Modo escuro"}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
