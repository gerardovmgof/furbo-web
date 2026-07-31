import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { getTeam, listActivePlayersByTeam } from "@/lib/queries";
import EditPlayerForm from "./EditPlayerForm";
import { deactivatePlayerAction } from "./actions";

export default async function AdminTeamPlayersPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  await requireAdmin();
  const { teamId } = await params;

  const team = await getTeam(teamId);
  if (!team) {
    return (
      <main className="mx-auto max-w-2xl py-8">
        <p className="text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">No se encontró el equipo.</p>
      </main>
    );
  }

  const players = await listActivePlayersByTeam(team.id);

  return (
    <main className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <Link href="/admin/equipos" className="text-sm text-emerald-700 dark:text-emerald-400 underline">
          ← Equipos
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Jugadores — {team.name}</h1>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          {players.length}/{team.player_limit} jugadores registrados
        </p>
      </div>

      <div className="space-y-2">
        {players.length === 0 && (
          <p className="text-sm text-zinc-500">Este equipo aún no tiene jugadores registrados.</p>
        )}
        {players.map((p) => (
          <div
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-3"
          >
            <EditPlayerForm
              teamId={team.id}
              playerId={p.id}
              currentName={p.name}
              currentJerseyNumber={p.jersey_number}
            />
            <form action={deactivatePlayerAction.bind(null, team.id, p.id)}>
              <button
                type="submit"
                className="rounded-lg border border-red-300 dark:border-red-900 px-3 py-1 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950"
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
