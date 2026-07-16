import { getPublicTournament, listTeamsByTournament, activePlayerCounts } from "@/lib/queries";

export const metadata = { title: "Equipos — Furbo Web" };
export const dynamic = "force-dynamic";

export default async function EquiposIndexPage() {
  const tournament = await getPublicTournament();

  if (!tournament) {
    return (
      <main className="mx-auto max-w-2xl py-8">
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="mt-2 text-zinc-400">Aún no hay torneos activos.</p>
      </main>
    );
  }

  const teams = await listTeamsByTournament(tournament.id);
  const counts = await activePlayerCounts(teams.map((t) => t.id));

  return (
    <main className="mx-auto max-w-2xl space-y-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Equipos</h1>
        <p className="mt-1 text-sm text-zinc-400">{tournament.name}</p>
      </div>

      {teams.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay equipos en este torneo.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {teams.map((t) => (
            <a
              key={t.id}
              href={`/equipos/${t.id}`}
              className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 transition hover:border-emerald-700"
            >
              <p className="font-semibold text-zinc-100">
                {t.name}
                {t.status === "withdrawn" && (
                  <span className="ml-2 text-xs font-normal text-red-400">(retirado)</span>
                )}
              </p>
              <p className="mt-1 text-sm text-zinc-400">
                {counts[t.id] ?? 0} jugadores registrados
              </p>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
