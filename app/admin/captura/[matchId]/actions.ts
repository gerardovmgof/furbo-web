"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { scoreSchema, uuidSchema } from "@/lib/validation";
import { getMatch, getTournament, listLegsForSlot } from "@/lib/queries";
import { seriesStatus, nextSlot, type SeriesLeg } from "@/lib/bracket";
import type { MatchRow } from "@/lib/types";

export interface FormState {
  error: string | null;
}

function parsePenalties(formData: FormData): { homePenalties: number | null; awayPenalties: number | null } | { error: string } {
  const homeRaw = formData.get("homePenalties");
  const awayRaw = formData.get("awayPenalties");
  if (!homeRaw && !awayRaw) return { homePenalties: null, awayPenalties: null };

  const hp = Number(homeRaw);
  const ap = Number(awayRaw);
  if (!Number.isInteger(hp) || !Number.isInteger(ap) || hp < 0 || ap < 0) {
    return { error: "Los penales deben ser números enteros positivos." };
  }
  if (hp === ap) {
    return { error: "Los penales no pueden terminar empatados." };
  }
  return { homePenalties: hp, awayPenalties: ap };
}

export async function captureResultAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();

  const matchIdParsed = uuidSchema.safeParse(formData.get("matchId"));
  if (!matchIdParsed.success) return { error: "Partido inválido." };
  const matchId = matchIdParsed.data;

  const match = await getMatch(matchId);
  if (!match) return { error: "Partido no encontrado." };

  const parsed = scoreSchema.safeParse({
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Marcador inválido." };
  }
  const isForfeit = formData.get("isForfeit") === "on";

  const penalties = parsePenalties(formData);
  if ("error" in penalties) return { error: penalties.error };

  const { error: matchError } = await supabase
    .from("matches")
    .update({
      status: "played",
      is_forfeit: isForfeit,
      home_score: parsed.data.homeScore,
      away_score: parsed.data.awayScore,
      home_penalties: penalties.homePenalties,
      away_penalties: penalties.awayPenalties,
      updated_by: admin.id,
    })
    .eq("id", matchId);
  if (matchError) return { error: "No se pudo guardar el marcador." };

  // Los goles se reescriben por completo en cada captura — permite corregir
  // un resultado sin arrastrar goles viejos. Un default (forfeit) nunca
  // registra goles, para no inflar la tabla de goleo.
  await supabase.from("goals").delete().eq("match_id", matchId);

  if (!isForfeit) {
    const rows: { match_id: string; player_id: string; team_id: string; count: number }[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("goal_")) continue;
      const [playerId, teamId] = key.slice(5).split("__");
      const count = Number(value);
      if (
        uuidSchema.safeParse(playerId).success &&
        uuidSchema.safeParse(teamId).success &&
        Number.isFinite(count) &&
        count > 0
      ) {
        rows.push({ match_id: matchId, player_id: playerId, team_id: teamId, count });
      }
    }
    if (rows.length > 0) {
      const { error: goalsError } = await supabase.from("goals").insert(rows);
      if (goalsError) {
        return { error: "El marcador se guardó, pero hubo un error al guardar los goles." };
      }
    }
  }

  revalidatePath(`/admin/captura/${matchId}`);
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");

  let propagationError: string | null = null;
  if (match.phase === "playoff" && match.bracket_slot !== null) {
    propagationError = await propagatePlayoffResult(match.tournament_id, match.bracket_slot);
    revalidatePath("/admin/liguilla");
    revalidatePath("/liguilla");
  }

  return { error: propagationError };
}

/**
 * Tras capturar un partido de liguilla, revisa si su cruce (ida+vuelta o
 * único) ya tiene ganador y, de ser así, lo propaga al siguiente cruce.
 * Si el siguiente cruce YA se jugó con un rival distinto, NO se sobrescribe
 * — se devuelve un error para que el admin lo resuelva a mano primero.
 */
async function propagatePlayoffResult(
  tournamentId: string,
  bracketSlot: number
): Promise<string | null> {
  const tournament = await getTournament(tournamentId);
  const bracketSize = tournament?.playoff_teams;
  if (!bracketSize) return null;

  const legs = await listLegsForSlot(tournamentId, bracketSlot);
  const status = seriesStatus(legs.map(toSeriesLeg));
  if (!status.complete || !status.winnerId) return null;

  const next = nextSlot(bracketSlot, bracketSize);
  if (!next) {
    // Era la final: el torneo queda finalizado.
    await supabase.from("tournaments").update({ status: "finished" }).eq("id", tournamentId);
    return null;
  }

  const destLegs = await listLegsForSlot(tournamentId, next.slot);
  if (destLegs.length === 0) return null;

  const alreadyPlayed = destLegs.some((l) => l.status === "played");
  const isTwoLegsDest = destLegs.length === 2;
  const leg1Dest = isTwoLegsDest ? destLegs.find((l) => l.leg === 1) : destLegs[0];

  const currentAssigned = next.isPrimary
    ? isTwoLegsDest
      ? leg1Dest?.away_team_id
      : leg1Dest?.home_team_id
    : isTwoLegsDest
      ? leg1Dest?.home_team_id
      : leg1Dest?.away_team_id;

  if (alreadyPlayed) {
    if (currentAssigned === status.winnerId) return null; // ya estaba propagado, nada que hacer
    return "El marcador se guardó, pero la siguiente ronda ya tiene un resultado jugado con otro rival — corrígela manualmente antes de continuar.";
  }

  for (const destLeg of destLegs) {
    const isLeg2 = destLeg.leg === 2;
    const field =
      destLegs.length === 1
        ? next.isPrimary
          ? "home_team_id"
          : "away_team_id"
        : next.isPrimary
          ? isLeg2
            ? "home_team_id"
            : "away_team_id"
          : isLeg2
            ? "away_team_id"
            : "home_team_id";
    await supabase
      .from("matches")
      .update({ [field]: status.winnerId })
      .eq("id", destLeg.id);
  }
  return null;
}

function toSeriesLeg(m: MatchRow): SeriesLeg {
  return {
    homeTeamId: m.home_team_id,
    awayTeamId: m.away_team_id,
    status: m.status,
    homeScore: m.home_score,
    awayScore: m.away_score,
    homePenalties: m.home_penalties,
    awayPenalties: m.away_penalties,
    leg: m.leg,
  };
}
