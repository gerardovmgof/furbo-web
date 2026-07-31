import { getPublicTournament, listMatchesByTournament } from "@/lib/queries";

export const dynamic = "force-dynamic";

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

export default async function ArbitroPage() {
  const tournament = await getPublicTournament();

  if (!tournament) {
    return (
      <main className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold">Partidos pendientes</h1>
        <p className="mt-2 text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">No hay torneos activos.</p>
      </main>
    );
  }

  const [regular, playoff] = await Promise.all([
    listMatchesByTournament(tournament.id, "regular"),
    listMatchesByTournament(tournament.id, "playoff"),
  ]);

  const pending = [...regular, ...playoff].filter(
    (m) =>
      m.status !== "played" &&
      m.status !== "canceled" &&
      m.home_team_id &&
      m.away_team_id
  );

  return (
    <main className="mx-auto max-w-3xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">Partidos pendientes</h1>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">{tournament.name}</p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-zinc-500">No hay partidos pendientes por capturar.</p>
      ) : (
        <div className="space-y-2">
          {pending.map((m) => (
            <div
              key={m.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4"
            >
              <div>
                <p className="text-zinc-900 dark:text-zinc-100">
                  {m.home_name} <span className="text-zinc-500">vs</span> {m.away_name}
                </p>
                <p className="text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
                  {m.phase === "playoff" ? `Liguilla · ronda ${m.round}` : `Jornada ${m.round}`}
                  {m.leg === 2 && " · vuelta"} · {formatKickoff(m.kickoff_at)}
                  {m.venue && ` · ${m.venue}`}
                  {m.status === "postponed" && " · pospuesto"}
                </p>
              </div>
              <a
                href={`/arbitro/captura/${m.id}`}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
              >
                Capturar
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
