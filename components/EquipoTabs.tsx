"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function EquipoTabs({ teamId }: { teamId: string }) {
  const pathname = usePathname();
  const TABS = [
    { href: `/equipo/${teamId}/plantilla`, label: "Plantilla" },
    { href: `/equipo/${teamId}/pagos`, label: "Pagos" },
  ];

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-zinc-200 dark:border-zinc-800 px-4 py-2">
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
