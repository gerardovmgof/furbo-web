import { getPublicTournament, topScorers } from "@/lib/queries";

export const metadata = { title: "Goleo — Furbo Web" };
export const dynamic = "force-dynamic";

export default async function GoleoPage() {
  const tournament = await getPublicTournament();

  if (!tournament) {
    return (
      <main className="mx-auto max-w-2xl py-8">
        <h1 className="text-2xl font-bold">Goleo</h1>
        <p className="mt-2 text-zinc-400">Aún no hay torneos activos.</p>
      </main>
    );
  }

  const scorers = await topScorers(tournament.id);

  return (
    <main className="mx-auto max-w-2xl space-y-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Goleo</h1>
        <p className="mt-1 text-sm text-zinc-400">{tournament.name}</p>
      </div>

      {scorers.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay goles registrados.</p>
      ) : (
        <div className="space-y-2">
          {scorers.map((s, idx) => (
            <div
              key={s.playerId}
              className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 text-center text-sm text-zinc-500">{idx + 1}</span>
                <div>
                  <p className="text-zinc-100">
                    <span className="mr-2 font-mono text-zinc-400">#{s.jerseyNumber}</span>
                    {s.playerName}
                  </p>
                  <a
                    href={`/equipos/${s.teamId}`}
                    className="text-xs text-zinc-500 hover:text-emerald-400"
                  >
                    {s.teamName}
                  </a>
                </div>
              </div>
              <span className="text-lg font-semibold text-emerald-400">{s.goals}</span>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
