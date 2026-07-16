import { listTournaments, listMatchesByTournament } from "@/lib/queries";
import GenerateBracketForm from "./GenerateBracketForm";
import TournamentSelect from "@/components/TournamentSelect";

function roundLabel(round: number, playoffTeams: 4 | 8): string {
  if (playoffTeams === 8) {
    return { 1: "Cuartos de final", 2: "Semifinal", 3: "Final" }[round] ?? `Ronda ${round}`;
  }
  return { 1: "Semifinal", 2: "Final" }[round] ?? `Ronda ${round}`;
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programado",
  played: "Jugado",
  postponed: "Pospuesto",
  canceled: "Cancelado",
};

export default async function LiguillaAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const tournaments = await listTournaments();

  if (tournaments.length === 0) {
    return (
      <main className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold">Liguilla</h1>
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

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Liguilla</h1>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-sm text-zinc-400">Torneo:</label>
          <TournamentSelect
            tournaments={tournaments}
            selectedId={selected.id}
            basePath="/admin/liguilla"
          />
        </div>
      </div>

      {selected.status === "playoffs" || selected.status === "finished" ? (
        <BracketView tournamentId={selected.id} playoffTeams={selected.playoff_teams ?? 8} />
      ) : (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
          <p className="mb-4 text-sm text-zinc-400">
            Cierra la fase regular en{" "}
            <a href="/admin/torneos" className="text-emerald-400 underline">
              Torneos
            </a>{" "}
            y genera la liguilla a partir de la tabla de posiciones actual.
          </p>
          <GenerateBracketForm tournamentId={selected.id} />
        </div>
      )}
    </main>
  );
}

async function BracketView({
  tournamentId,
  playoffTeams,
}: {
  tournamentId: string;
  playoffTeams: 4 | 8;
}) {
  const matches = await listMatchesByTournament(tournamentId, "playoff");
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);
  const slots = [...new Set(matches.map((m) => m.bracket_slot))].filter(
    (s): s is number => s !== null
  );

  return (
    <div className="space-y-6">
      {rounds.map((round) => (
        <div key={round}>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            {roundLabel(round, playoffTeams)}
          </h2>
          <div className="space-y-2">
            {slots
              .filter((slot) => matches.some((m) => m.round === round && m.bracket_slot === slot))
              .map((slot) => {
                const legs = matches
                  .filter((m) => m.bracket_slot === slot)
                  .sort((a, b) => a.leg - b.leg);
                return (
                  <div key={slot} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                    {legs.map((m) => (
                      <div
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 py-1"
                      >
                        <div>
                          <p className="text-zinc-100">
                            {m.home_name}
                            {m.status === "played" && (
                              <span className="mx-2 font-mono text-emerald-400">
                                {m.home_score}-{m.away_score}
                                {m.home_penalties !== null &&
                                  ` (pen. ${m.home_penalties}-${m.away_penalties})`}
                              </span>
                            )}
                            {m.status !== "played" && (
                              <span className="mx-2 text-zinc-500">vs</span>
                            )}
                            {m.away_name}
                          </p>
                          <p className="text-xs text-zinc-500">
                            {legs.length > 1 ? (m.leg === 1 ? "Ida" : "Vuelta") : "Partido único"}{" "}
                            · {STATUS_LABEL[m.status]}
                          </p>
                        </div>
                        {m.home_team_id && m.away_team_id ? (
                          <a
                            href={`/admin/captura/${m.id}`}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
                          >
                            {m.status === "played" ? "Editar" : "Capturar"}
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-600">Cruce sin definir</span>
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
  );
}
