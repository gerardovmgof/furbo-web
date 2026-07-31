import { requireReferee } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";

export default async function ArbitroLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Segunda capa: revalida contra DB aunque el proxy ya haya dejado pasar.
  await requireReferee();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-4 py-3">
        <p className="font-semibold">⚽ Furbo Web — Árbitro</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-1 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Salir
          </button>
        </form>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
