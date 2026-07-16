import { getPublicTournament, listTeamsByTournament, listMatchesByTournament } from "@/lib/queries";
import { computeStandings } from "@/lib/standings";
import { getZone, suggestPlayoffTeams } from "@/lib/zones";

export const dynamic = "force-dynamic";

const ZONE_BORDER: Record<string, string> = {
  clasifica: "border-l-4 border-l-emerald-500",
  repechaje: "border-l-4 border-l-amber-500",
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

export default async function Home() {
  const tournament = await getPublicTournament();

  if (!tournament) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="text-6xl">⚽</span>
        <h1 className="text-4xl font-bold tracking-tight">Furbo Web</h1>
        <p className="text-zinc-400">Próximamente — plataforma de gestión de ligas de fútbol</p>
      </main>
    );
  }

  const [teams, matches] = await Promise.all([
    listTeamsByTournament(tournament.id),
    listMatchesByTournament(tournament.id, "regular"),
  ]);
  const fullStandings = computeStandings(teams, matches);
  const standings = fullStandings.slice(0, 5);
  const playoffTeams = tournament.playoff_teams ?? suggestPlayoffTeams(teams.length);
  const upcoming = matches
    .filter((m) => m.status === "scheduled")
    .sort((a, b) => a.round - b.round)
    .slice(0, 5);

  return (
    <main className="mx-auto max-w-3xl space-y-10 py-8">
      <div className="text-center">
        <span className="text-5xl">⚽</span>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{tournament.name}</h1>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Posiciones
          </h2>
          <a href="/tabla" className="text-sm text-emerald-400 hover:underline">
            Ver tabla completa →
          </a>
        </div>
        {standings.length === 0 ? (
          <p className="text-sm text-zinc-500">Aún no hay equipos en este torneo.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-zinc-800">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-zinc-400">
                  <th className="px-3 py-2 font-medium">#</th>
                  <th className="px-3 py-2 font-medium">Equipo</th>
                  <th className="px-2 py-2 text-center font-medium">PJ</th>
                  <th className="px-2 py-2 text-center font-medium">DIF</th>
                  <th className="px-3 py-2 text-center font-semibold">PTS</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((row) => {
                  const zone = getZone(row.pos, playoffTeams);
                  return (
                    <tr
                      key={row.teamId}
                      className={`border-b border-zinc-900 last:border-0 ${zone.kind ? ZONE_BORDER[zone.kind] : ""}`}
                    >
                      <td className="px-3 py-2 text-zinc-400">{row.pos}</td>
                      <td className="px-3 py-2 text-zinc-100">{row.name}</td>
                      <td className="px-2 py-2 text-center text-zinc-300">{row.jj}</td>
                      <td className="px-2 py-2 text-center text-zinc-300">{row.dif}</td>
                      <td className="px-3 py-2 text-center font-semibold text-zinc-100">
                        {row.pts}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {playoffTeams && fullStandings.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
              Clasifica a liguilla
            </span>
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-500" />
              Zona de repechaje
            </span>
          </div>
        )}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Próximos partidos
          </h2>
          <a href="/calendario" className="text-sm text-emerald-400 hover:underline">
            Ver calendario completo →
          </a>
        </div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-zinc-500">No hay partidos programados por el momento.</p>
        ) : (
          <div className="space-y-2">
            {upcoming.map((m) => (
              <div key={m.id} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-zinc-100">
                  {m.home_name} <span className="text-zinc-500">vs</span> {m.away_name}
                </p>
                <p className="text-sm text-zinc-400">
                  Jornada {m.round} · {formatKickoff(m.kickoff_at)}
                  {m.venue && ` · ${m.venue}`}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
