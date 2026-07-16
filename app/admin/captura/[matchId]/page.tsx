import { getMatch, teamNamesById, listActivePlayersByTeam, goalsByMatch } from "@/lib/queries";
import ScoreCaptureForm from "./ScoreCaptureForm";

export default async function CapturaPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getMatch(matchId);

  if (!match || !match.home_team_id || !match.away_team_id) {
    return (
      <main className="mx-auto max-w-md py-8">
        <p className="text-zinc-400">No se encontró el partido.</p>
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

  return (
    <main className="mx-auto max-w-2xl space-y-6 py-8">
      <div>
        <h1 className="text-2xl font-bold">
          {homeTeam.name} vs {awayTeam.name}
        </h1>
        <p className="mt-1 text-sm text-zinc-400">Jornada {match.round}</p>
      </div>

      <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
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
        />
      </div>

      <a href="/admin/calendario" className="text-sm text-emerald-400 underline">
        ← Volver al calendario
      </a>
    </main>
  );
}
