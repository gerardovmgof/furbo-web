import { listTournaments, listTeamsByTournament, listMatchesByTournament } from "@/lib/queries";
import { setMatchStatusAction, deleteMatchAction } from "./actions";
import CreateMatchForm from "./CreateMatchForm";
import EditMatchForm from "./EditMatchForm";
import GenerateScheduleForm from "./GenerateScheduleForm";
import TournamentSelect from "@/components/TournamentSelect";

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

export default async function CalendarioAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ t?: string }>;
}) {
  const { t } = await searchParams;
  const tournaments = await listTournaments();

  if (tournaments.length === 0) {
    return (
      <main className="mx-auto max-w-4xl py-8">
        <h1 className="text-2xl font-bold">Calendario</h1>
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
  const [teams, matches] = await Promise.all([
    listTeamsByTournament(selected.id),
    listMatchesByTournament(selected.id, "regular"),
  ]);
  const activeTeams = teams.filter((team) => team.status === "active");

  const rounds = [...new Set(matches.map((m) => m.round))].sort((a, b) => a - b);

  return (
    <main className="mx-auto max-w-4xl space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Calendario</h1>
        <div className="mt-2 flex items-center gap-2">
          <label className="text-sm text-zinc-400">Torneo:</label>
          <TournamentSelect
            tournaments={tournaments}
            selectedId={selected.id}
            basePath="/admin/calendario"
          />
        </div>
      </div>

      {rounds.length === 0 && (
        <div className="rounded-xl border border-emerald-900 bg-emerald-950/30 p-4">
          <GenerateScheduleForm
            tournamentId={selected.id}
            activeTeamsCount={activeTeams.length}
          />
        </div>
      )}

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
        <CreateMatchForm tournamentId={selected.id} teams={activeTeams} />
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
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-800 bg-zinc-900 p-4"
                  >
                    <div>
                      <p className="text-zinc-100">
                        {m.home_name}
                        {m.status === "played" && (
                          <span className="mx-2 font-mono text-emerald-400">
                            {m.home_score}-{m.away_score}
                          </span>
                        )}
                        {m.status !== "played" && <span className="mx-2 text-zinc-500">vs</span>}
                        {m.away_name}
                      </p>
                      <p className="text-sm text-zinc-400">
                        {STATUS_LABEL[m.status]}
                        {m.is_forfeit && " · default"} · {formatKickoff(m.kickoff_at)}
                        {m.venue && ` · ${m.venue}`}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={`/admin/captura/${m.id}`}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-emerald-500"
                      >
                        {m.status === "played" ? "Editar resultado" : "Capturar"}
                      </a>
                      {m.status !== "played" && (
                        <>
                          <EditMatchForm
                            matchId={m.id}
                            round={m.round}
                            homeTeamId={m.home_team_id ?? ""}
                            awayTeamId={m.away_team_id ?? ""}
                            kickoffAt={m.kickoff_at}
                            venue={m.venue}
                            streamUrl={m.stream_url}
                            teams={activeTeams}
                          />
                          <form
                            action={setMatchStatusAction.bind(
                              null,
                              m.id,
                              m.status === "postponed" ? "scheduled" : "postponed"
                            )}
                          >
                            <button
                              type="submit"
                              className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 hover:bg-zinc-800"
                            >
                              {m.status === "postponed" ? "Reprogramar" : "Posponer"}
                            </button>
                          </form>
                          <form action={deleteMatchAction.bind(null, m.id)}>
                            <button
                              type="submit"
                              className="rounded-lg border border-red-900 px-3 py-1.5 text-sm text-red-300 hover:bg-red-950"
                            >
                              Eliminar
                            </button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
