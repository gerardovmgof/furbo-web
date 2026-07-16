"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Inicio" },
  { href: "/tabla", label: "Posiciones" },
  { href: "/goleo", label: "Goleo" },
  { href: "/calendario", label: "Calendario" },
  { href: "/equipos", label: "Equipos" },
  { href: "/liguilla", label: "Liguilla" },
];

export default function PublicTabs() {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-800">
      <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-1 shrink-0 font-semibold text-zinc-100">
          ⚽ Furbo Web
        </Link>
        <nav className="flex flex-1 gap-1 overflow-x-auto">
          {TABS.map((tab) => {
            const active = tab.href === "/" ? pathname === "/" : pathname.startsWith(tab.href);
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
        <Link
          href="/login"
          className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:bg-zinc-800"
        >
          Acceso
        </Link>
      </div>
    </header>
  );
}
