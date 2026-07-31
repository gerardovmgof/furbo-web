import Link from "next/link";
import { requireTeamOwner } from "@/lib/auth";
import { listTeamsByOwner, listOpenTournamentsForRegistration } from "@/lib/queries";
import RegisterTeamForm from "./RegisterTeamForm";

export default async function EquipoDashboardPage() {
  const user = await requireTeamOwner();

  const [teams, tournaments] = await Promise.all([
    listTeamsByOwner(user.id),
    listOpenTournamentsForRegistration(),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mis equipos</h1>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          Un mismo usuario puede tener varios equipos, incluso en torneos distintos.
        </p>
      </div>

      <div className="space-y-2">
        {teams.length === 0 && (
          <p className="text-sm text-zinc-500">Aún no tienes equipos registrados.</p>
        )}
        {teams.map((team) => (
          <Link
            key={team.id}
            href={`/equipo/${team.id}/plantilla`}
            className="block rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4 transition hover:border-emerald-600 dark:hover:border-emerald-700"
          >
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {team.name}
              {team.status === "withdrawn" && (
                <span className="ml-2 text-xs font-normal text-red-600 dark:text-red-400">(retirado)</span>
              )}
            </p>
            <p className="text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
              {team.tournament_name} · {team.player_limit} registros pagados
            </p>
          </Link>
        ))}
      </div>

      <RegisterTeamForm tournaments={tournaments} hasTeams={teams.length > 0} />
    </main>
  );
}
