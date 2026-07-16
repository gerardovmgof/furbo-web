"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/torneos", label: "Torneos" },
  { href: "/admin/equipos", label: "Equipos" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/calendario", label: "Calendario" },
  { href: "/admin/liguilla", label: "Liguilla" },
];

export default function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-t border-zinc-800 px-4 py-2">
      {TABS.map((tab) => {
        const active =
          tab.href === "/admin" ? pathname === "/admin" : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm transition ${
              active
                ? "bg-emerald-600 text-white"
                : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
