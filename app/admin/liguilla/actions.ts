"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getTournament, listTeamsByTournament, listMatchesByTournament } from "@/lib/queries";
import { computeStandings } from "@/lib/standings";
import { generateBracket } from "@/lib/bracket";
import { uuidSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
}

export async function generateBracketAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const tournamentIdParsed = uuidSchema.safeParse(formData.get("tournamentId"));
  if (!tournamentIdParsed.success) return { error: "Torneo inválido." };
  const tournamentId = tournamentIdParsed.data;

  const playoffTeamsRaw = Number(formData.get("playoffTeams"));
  if (playoffTeamsRaw !== 4 && playoffTeamsRaw !== 8 && playoffTeamsRaw !== 16) {
    return { error: "Elige 4, 8 o 16 equipos." };
  }
  const playoffTeams = playoffTeamsRaw as 4 | 8 | 16;
  const twoLegs = formData.get("twoLegs") === "on";

  const tournament = await getTournament(tournamentId);
  if (!tournament) return { error: "Torneo no encontrado." };
  if (tournament.status === "playoffs" || tournament.status === "finished") {
    return { error: "Este torneo ya tiene una liguilla generada." };
  }

  const [teams, matches] = await Promise.all([
    listTeamsByTournament(tournamentId),
    listMatchesByTournament(tournamentId, "regular"),
  ]);
  const standings = computeStandings(teams, matches).filter((s) => !s.withdrawn);
  if (standings.length < playoffTeams) {
    return {
      error: `Necesitas al menos ${playoffTeams} equipos activos en la tabla para esta liguilla.`,
    };
  }

  const seededIds = standings.slice(0, playoffTeams).map((s) => s.teamId);
  const plans = generateBracket(seededIds, twoLegs);

  const { error: insertError } = await supabase.from("matches").insert(
    plans.map((p) => ({
      tournament_id: tournamentId,
      phase: "playoff",
      round: p.round,
      bracket_slot: p.bracketSlot,
      leg: p.leg,
      home_team_id: p.homeTeamId,
      away_team_id: p.awayTeamId,
      status: "scheduled",
    }))
  );
  if (insertError) return { error: "No se pudo generar la liguilla." };

  const { error: tournamentError } = await supabase
    .from("tournaments")
    .update({ status: "playoffs", playoff_teams: playoffTeams, playoff_two_legs: twoLegs })
    .eq("id", tournamentId);
  if (tournamentError) return { error: "La liguilla se creó, pero no se pudo actualizar el torneo." };

  revalidatePath("/admin/liguilla");
  revalidatePath("/admin/torneos");
  revalidatePath("/liguilla");
  return { error: null };
}
