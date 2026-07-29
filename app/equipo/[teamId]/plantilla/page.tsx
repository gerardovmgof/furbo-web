import { requireOwnedTeam } from "@/lib/auth";
import { getTournament, listActivePlayersByTeam } from "@/lib/queries";
import { deactivatePlayerAction } from "./actions";
import AddPlayerForm from "./AddPlayerForm";

export default async function PlantillaPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;
  const { team } = await requireOwnedTeam(teamId);

  const [tournament, players] = await Promise.all([
    getTournament(team.tournament_id),
    listActivePlayersByTeam(team.id),
  ]);

  const full = players.length >= team.player_limit;
  const closed = !tournament?.registration_open || team.status !== "active";

  return (
    <main className="mx-auto max-w-2xl space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Plantilla — {team.name}</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {players.length}/{team.player_limit} jugadores registrados
          {team.status !== "active" && " · equipo retirado"}
          {tournament && !tournament.registration_open && " · registro cerrado"}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <AddPlayerForm teamId={team.id} disabled={full || closed} />
      </div>

      <div className="space-y-2">
        {players.length === 0 && (
          <p className="text-sm text-zinc-500">Aún no has registrado jugadores.</p>
        )}
        {players.map((p) => (
          <div
            key={p.id}
            className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
          >
            <p className="text-zinc-100">
              <span className="mr-2 inline-block w-8 text-center font-mono text-zinc-400">
                #{p.jersey_number}
              </span>
              {p.name}
            </p>
            <form action={deactivatePlayerAction.bind(null, team.id, p.id)}>
              <button
                type="submit"
                className="rounded-lg border border-red-900 px-3 py-1 text-sm text-red-300 hover:bg-red-950"
              >
                Dar de baja
              </button>
            </form>
          </div>
        ))}
      </div>
    </main>
  );
}
