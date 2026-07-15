import { requireAdmin } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Segunda capa: revalida contra DB aunque el proxy ya haya dejado pasar.
  await requireAdmin();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <p className="font-semibold">⚽ Furbo Web — Administración</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Salir
          </button>
        </form>
      </header>
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
