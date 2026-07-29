import { requireTeamUser } from "@/lib/auth";
import { logoutAction } from "@/app/login/actions";
import EquipoTabs from "@/components/EquipoTabs";

export default async function TeamLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Segunda capa: revalida contra DB aunque el proxy ya haya dejado pasar.
  await requireTeamUser();

  return (
    <div className="flex min-h-full flex-1 flex-col bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <p className="font-semibold">⚽ Furbo Web — Mi equipo</p>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-lg border border-zinc-700 px-3 py-1 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Salir
          </button>
        </form>
      </header>
      <EquipoTabs />
      <div className="flex-1 p-4">{children}</div>
    </div>
  );
}
