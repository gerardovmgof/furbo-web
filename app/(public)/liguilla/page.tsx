import { getPublicTournament, listMatchesByTournament } from "@/lib/queries";
import type { BracketSize } from "@/lib/bracket";

export const dynamic = "force-dynamic";
export const metadata = { title: "Liguilla — Furbo Web" };

function roundLabel(round: number, playoffTeams: BracketSize): string {
  if (playoffTeams === 16) {
    return (
      { 1: "Octavos de final", 2: "Cuartos de final", 3: "Semifinal", 4: "Final" }[round] ??
      `Ronda ${round}`
    );
  }
  if (playoffTeams === 8) {
    return { 1: "Cuartos de final", 2: "Semifinal", 3: "Final" }[round] ?? `Ronda ${round}`;
  }
  return { 1: "Semifinal", 2: "Final" }[round] ?? `Ronda ${round}`;
}

export default async function LiguillaPage() {
  const tournament = await getPublicTournament();

  if (!tournament || (tournament.status !== "playoffs" && tournament.status !== "finished")) {
    return (
      <main className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold">Liguilla</h1>
        <p className="mt-2 text-zinc-400">La liguilla aún no se ha generado.</p>
      </main>
    );
  }

  const playoffTeams = tournament.playoff_teams ?? 8;
  const matches = await listMatchesByTournament(tournament.id, "playoff");
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const slots = [...new Set(matches.map((m) => m.bracket_slot))].filter(
    (s): s is number => s !== null
  );

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Liguilla</h1>
        <p className="mt-1 text-sm text-zinc-400">{tournament.name}</p>
      </div>

      <div className="space-y-6">
        {rounds.map((round) => (
          <div key={round}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              {roundLabel(round, playoffTeams)}
            </h2>
            <div className="space-y-2">
              {slots
                .filter((slot) =>
                  matches.some((m) => m.round === round && m.bracket_slot === slot)
                )
                .map((slot) => {
                  const legs = matches
                    .filter((m) => m.bracket_slot === slot)
                    .sort((a, b) => a.leg - b.leg);
                  return (
                    <div key={slot} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                      {legs.map((m) => (
                        <div key={m.id} className="py-1">
                          <p className="text-zinc-100">
                            {m.home_name}
                            {m.status === "played" ? (
                              <span className="mx-2 font-mono text-emerald-400">
                                {m.home_score}-{m.away_score}
                                {m.home_penalties !== null &&
                                  ` (pen. ${m.home_penalties}-${m.away_penalties})`}
                              </span>
                            ) : (
                              <span className="mx-2 text-zinc-500">vs</span>
                            )}
                            {m.away_name}
                          </p>
                          {legs.length > 1 && (
                            <p className="text-xs text-zinc-500">
                              {m.leg === 1 ? "Ida" : "Vuelta"}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
