"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// "Panel" no está aquí a propósito: el título del header ("⚽ Furbo Web —
// Administración") ya es un link a /admin — tenerlo también como pestaña
// duplicaba el mismo destino en dos menús a la vista al mismo tiempo,
// justo la confusión que reportó la primera prueba de usuario real.
const TABS = [
  { href: "/admin/torneos", label: "Torneos" },
  { href: "/admin/equipos", label: "Equipos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/calendario", label: "Calendario" },
  { href: "/admin/liguilla", label: "Liguilla" },
  { href: "/admin/cobros", label: "Cobros" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-zinc-200 dark:border-zinc-800 px-4 py-2">
      {TABS.map((tab) => {
        const active = pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
              active
                ? "bg-emerald-600 text-white"
                : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-800 dark:hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
