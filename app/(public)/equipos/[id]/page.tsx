import { getTeam, listActivePlayersByTeam, listMatchesByTeam } from "@/lib/queries";

export const dynamic = "force-dynamic";

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

export default async function EquipoPublicoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const team = await getTeam(id);

  if (!team) {
    return (
      <main className="mx-auto max-w-2xl py-8">
        <p className="text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">No se encontró el equipo.</p>
      </main>
    );
  }

  const [players, matches] = await Promise.all([
    listActivePlayersByTeam(team.id),
    listMatchesByTeam(team.id),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">
          {team.name}
          {team.status === "withdrawn" && (
            <span className="ml-2 text-sm font-normal text-red-600 dark:text-red-400">(retirado)</span>
          )}
        </h1>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">{players.length} jugadores registrados</p>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          Plantilla
        </h2>
        {players.length === 0 ? (
          <p className="text-sm text-zinc-500">Sin jugadores registrados.</p>
        ) : (
          <div className="space-y-1">
            {players.map((p) => (
              <div
                key={p.id}
                className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 px-4 py-2 text-zinc-900 dark:text-zinc-100"
              >
                <span className="mr-2 inline-block w-8 text-center font-mono text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
                  #{p.jersey_number}
                </span>
                {p.name}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          Partidos
        </h2>
        {matches.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no tiene partidos programados.</p>
        ) : (
          <div className="space-y-2">
            {matches.map((m) => (
              <div key={m.id} className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-4">
                <p className="text-zinc-900 dark:text-zinc-100">
                  {m.home_name}
                  {m.status === "played" ? (
                    <span className="mx-2 font-mono text-emerald-700 dark:text-emerald-400">
                      {m.home_score}-{m.away_score}
                    </span>
                  ) : (
                    <span className="mx-2 text-zinc-500">vs</span>
                  )}
                  {m.away_name}
                </p>
                <p className="text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
                  Jornada {m.round} · {STATUS_LABEL[m.status]}
                  {m.is_forfeit && " · default"} · {formatKickoff(m.kickoff_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
