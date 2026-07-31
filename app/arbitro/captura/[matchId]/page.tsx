import { getMatch, teamNamesById, listActivePlayersByTeam, goalsByMatch } from "@/lib/queries";
import ScoreCaptureForm from "@/components/ScoreCaptureForm";

export default async function ArbitroCapturaPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getMatch(matchId);

  if (!match) {
    return (
      <main className="mx-auto max-w-md py-8">
        <p className="text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">No se encontró el partido.</p>
      </main>
    );
  }

  if (match.status === "played") {
    return (
      <main className="mx-auto max-w-md space-y-3 py-8">
        <p className="text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          Este partido ya se jugó — solo el admin puede corregir un resultado guardado.
        </p>
        <a href="/arbitro" className="inline-block text-sm text-emerald-700 dark:text-emerald-400 underline">
          ← Volver a pendientes
        </a>
      </main>
    );
  }

  if (!match.home_team_id || !match.away_team_id) {
    return (
      <main className="mx-auto max-w-md py-8">
        <p className="text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          Este cruce aún no está definido — falta que se resuelva la ronda anterior.
        </p>
        <a href="/arbitro" className="mt-3 inline-block text-sm text-emerald-700 dark:text-emerald-400 underline">
          ← Volver a pendientes
        </a>
      </main>
    );
  }

  const [names, homePlayers, awayPlayers, goals] = await Promise.all([
    teamNamesById([match.home_team_id, match.away_team_id]),
    listActivePlayersByTeam(match.home_team_id),
    listActivePlayersByTeam(match.away_team_id),
    goalsByMatch(match.id),
  ]);

  const homeTeam = { id: match.home_team_id, name: names[match.home_team_id] ?? "Equipo" };
  const awayTeam = { id: match.away_team_id, name: names[match.away_team_id] ?? "Equipo" };
  const isPlayoff = match.phase === "playoff";

  return (
    <main className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">
          {homeTeam.name} vs {awayTeam.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-600 dark:text-zinc-400">
          {isPlayoff
            ? `Liguilla · ronda ${match.round}${match.leg === 2 ? " · vuelta" : ""}`
            : `Jornada ${match.round}`}
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 p-6">
        <ScoreCaptureForm
          matchId={match.id}
          homeTeam={homeTeam}
          awayTeam={awayTeam}
          homePlayers={homePlayers}
          awayPlayers={awayPlayers}
          existingGoals={goals}
          initialHomeScore={match.home_score}
          initialAwayScore={match.away_score}
          initialForfeit={match.is_forfeit}
          isPlayoff={isPlayoff}
          initialHomePenalties={match.home_penalties}
          initialAwayPenalties={match.away_penalties}
          initialStreamUrl={match.stream_url}
        />
      </div>

      <a href="/arbitro" className="text-sm text-emerald-700 dark:text-emerald-400 underline">
        ← Volver a pendientes
      </a>
    </main>
  );
}
