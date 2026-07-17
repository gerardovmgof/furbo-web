import Link from "next/link";
import { listTournaments, listTeamsByTournament, activePlayerCounts } from "@/lib/queries";
import { setTeamStatusAction } from "./actions";
import CreateTeamForm from "./CreateTeamForm";
import EditTeamForm from "./EditTeamForm";
import TournamentSelect from "@/components/TournamentSelect";

export default async function EquiposPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const tournaments = await listTournaments();

  if (tournaments.length === 0) {
    return (
      <main className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="mt-2 text-zinc-400">
          Primero crea un torneo en{" "}
          <a href="/admin/torneos" className="text-emerald-400 underline">
            Torneos
          </a>
          .
        </p>
      </main>
    );
  }

  const selected = tournaments.find((x) => x.id === t) ?? tournaments[0];
  const teams = await listTeamsByTournament(selected.id);
  const counts = await activePlayerCounts(teams.map((team) => team.id));

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Equipos</h1>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-sm text-zinc-400" htmlFor="tournament">
            Torneo:
          </label>
          <TournamentSelect
            tournaments={tournaments}
            selectedId={selected.id}
            basePath="/admin/equipos"
          />
        </div>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <CreateTeamForm tournamentId={selected.id} />
      </div>

      <div className="space-y-3">
        {teams.length === 0 && <p className="text-sm text-zinc-500">Aún no hay equipos.</p>}
        {teams.map((team) => {
          const used = counts[team.id] ?? 0;
          return (
            <div key={team.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-zinc-100">
                    {team.name}
                    {team.status === "withdrawn" && (
                      <span className="ml-2 text-xs font-normal text-red-400">(retirado)</span>
                    )}
                  </p>
                  <p className="text-sm text-zinc-400">
                    {used}/{team.player_limit} jugadores registrados
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/admin/equipos/${team.id}`}
                    className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                  >
                    Jugadores
                  </Link>
                  <EditTeamForm
                    teamId={team.id}
                    currentName={team.name}
                    currentPlayerLimit={team.player_limit}
                  />
                  <form
                    action={setTeamStatusAction.bind(
                      null,
                      team.id,
                      team.status === "active" ? "withdrawn" : "active"
                    )}
                  >
                    <button
                      type="submit"
                      className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                    >
                      {team.status === "active" ? "Retirar del torneo" : "Reactivar"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
