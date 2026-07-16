import { getPublicTournament, listTeamsByTournament, listMatchesByTournament } from "@/lib/queries";
import { computeStandings } from "@/lib/standings";
import { getZone, suggestPlayoffTeams } from "@/lib/zones";

export const metadata = { title: "Posiciones — Furbo Web" };
export const dynamic = "force-dynamic";

const ZONE_BORDER: Record<string, string> = {
  clasifica: "border-l-4 border-l-emerald-500",
  repechaje: "border-l-4 border-l-amber-500",
};

export default async function TablaPage() {
  const tournament = await getPublicTournament();

  if (!tournament) {
    return (
      <main className="mx-auto max-w-3xl py-8">
        <h1 className="text-2xl font-bold">Posiciones</h1>
        <p className="mt-2 text-zinc-400">Aún no hay torneos activos.</p>
      </main>
    );
  }

  const [teams, matches] = await Promise.all([
    listTeamsByTournament(tournament.id),
    listMatchesByTournament(tournament.id, "regular"),
  ]);
  const standings = computeStandings(teams, matches);
  const playoffTeams = tournament.playoff_teams ?? suggestPlayoffTeams(teams.length);

  return (
    <main className="mx-auto max-w-3xl space-y-4 py-8">
      <div>
        <h1 className="text-2xl font-bold">Posiciones</h1>
        <p className="mt-1 text-sm text-zinc-400">{tournament.name}</p>
      </div>

      {standings.length === 0 ? (
        <p className="text-sm text-zinc-500">Aún no hay equipos en este torneo.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900 text-left text-zinc-400">
                <th className="px-3 py-2 font-medium">#</th>
                <th className="px-3 py-2 font-medium">Equipo</th>
                <th className="px-2 py-2 text-center font-medium">JJ</th>
                <th className="px-2 py-2 text-center font-medium">JG</th>
                <th className="px-2 py-2 text-center font-medium">JE</th>
                <th className="px-2 py-2 text-center font-medium">JP</th>
                <th className="px-2 py-2 text-center font-medium">GF</th>
                <th className="px-2 py-2 text-center font-medium">GC</th>
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
                  <td className="px-3 py-2 text-zinc-100">
                    <a href={`/equipos/${row.teamId}`} className="hover:text-emerald-400">
                      {row.name}
                    </a>
                    {row.withdrawn && (
                      <span className="ml-2 text-xs text-red-400">(retirado)</span>
                    )}
                  </td>
                  <td className="px-2 py-2 text-center text-zinc-300">{row.jj}</td>
                  <td className="px-2 py-2 text-center text-zinc-300">{row.jg}</td>
                  <td className="px-2 py-2 text-center text-zinc-300">{row.je}</td>
                  <td className="px-2 py-2 text-center text-zinc-300">{row.jp}</td>
                  <td className="px-2 py-2 text-center text-zinc-300">{row.gf}</td>
                  <td className="px-2 py-2 text-center text-zinc-300">{row.gc}</td>
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

      {playoffTeams && standings.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
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
    </main>
  );
}
