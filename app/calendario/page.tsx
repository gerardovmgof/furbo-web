import { getPublicTournament, listMatchesByTournament } from "@/lib/queries";

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Programado",
  played: "Jugado",
  postponed: "Pospuesto",
  canceled: "Cancelado",
};

function formatKickoff(iso: string | null): string {
  if (!iso) return "Horario por definir";
  return new Date(iso).toLocaleString("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CalendarioPage() {
  const tournament = await getPublicTournament();

  if (!tournament) {
    return (
      <main className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="mt-2 text-zinc-400">Aún no hay torneos activos.</p>
      </main>
    );
  }

  const matches = await listMatchesByTournament(tournament.id, "regular");
  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <main className="mx-auto max-w-3xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <p className="mt-1 text-sm text-zinc-400">{tournament.name}</p>
      </div>

      <div className="space-y-6">
        {rounds.length === 0 && (
          <p className="text-sm text-zinc-500">Aún no hay partidos programados.</p>
        )}
        {rounds.map((round) => (
          <div key={round}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Jornada {round}
            </h2>
            <div className="space-y-2">
              {matches
                .filter((m) => m.round === round)
                .map((m) => (
                  <div
                    key={m.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <p className="text-zinc-100">
                      {m.home_name}
                      {m.status === "played" ? (
                        <span className="mx-2 font-mono text-emerald-400">
                          {m.home_score}-{m.away_score}
                        </span>
                      ) : (
                        <span className="mx-2 text-zinc-500">vs</span>
                      )}
                      {m.away_name}
                    </p>
                    <p className="text-sm text-zinc-400">
                      {STATUS_LABEL[m.status]}
                      {m.is_forfeit && " · default"} · {formatKickoff(m.kickoff_at)}
                      {m.venue && ` · ${m.venue}`}
                    </p>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
