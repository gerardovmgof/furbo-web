"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { matchSchema, uuidSchema, generateScheduleSchema, parseStreamUrl } from "@/lib/validation";
import { generateRoundRobin } from "@/lib/schedule";

export interface FormState {
  error: string | null;
  ok?: boolean;
}

export async function generateScheduleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const tournamentIdParsed = uuidSchema.safeParse(formData.get("tournamentId"));
  const parsed = generateScheduleSchema.safeParse({
    doubleRound: formData.get("doubleRound") === "on",
  });
  if (!tournamentIdParsed.success) return { error: "Torneo inválido." };
  if (!parsed.success) return { error: "Datos inválidos." };

  const { count } = await supabase
    .from("matches")
    .select("id", { count: "exact", head: true })
    .eq("tournament_id", tournamentIdParsed.data)
    .eq("phase", "regular");
  if ((count ?? 0) > 0) {
    return {
      error: "Ya hay partidos de fase regular en este torneo. Elimínalos primero si quieres re-sortear.",
    };
  }

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentIdParsed.data)
    .eq("status", "active");
  const teamIds = (teams as { id: string }[] | null)?.map((t) => t.id) ?? [];
  if (teamIds.length < 2) {
    return { error: "Necesitas al menos 2 equipos activos para sortear el calendario." };
  }

  let plans;
  try {
    plans = generateRoundRobin(teamIds, { doubleRound: parsed.data.doubleRound });
  } catch {
    return { error: "No se pudo generar el calendario." };
  }

  const rows = plans.map((p) => ({
    tournament_id: tournamentIdParsed.data,
    phase: "regular" as const,
    round: p.round,
    leg: 1 as const,
    home_team_id: p.homeTeamId,
    away_team_id: p.awayTeamId,
    status: "scheduled" as const,
  }));

  const { error } = await supabase.from("matches").insert(rows);
  if (error) return { error: "No se pudo guardar el calendario generado." };

  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { error: null };
}

/**
 * Suma al calendario ya generado los equipos activos que todavía no tienen
 * NINGÚN partido de fase regular (típicamente uno agregado por el admin
 * después de "Iniciar fase regular"). A diferencia de generateScheduleAction,
 * NO borra ni toca los partidos existentes — solo agrega jornadas nuevas al
 * final con los cruces del equipo nuevo contra cada equipo activo existente
 * (y contra otros equipos nuevos, si se agregó más de uno a la vez).
 */
export async function extendScheduleAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const tournamentIdParsed = uuidSchema.safeParse(formData.get("tournamentId"));
  const parsed = generateScheduleSchema.safeParse({
    doubleRound: formData.get("doubleRound") === "on",
  });
  if (!tournamentIdParsed.success) return { error: "Torneo inválido." };
  if (!parsed.success) return { error: "Datos inválidos." };

  const { data: teams } = await supabase
    .from("teams")
    .select("id")
    .eq("tournament_id", tournamentIdParsed.data)
    .eq("status", "active");
  const activeTeamIds = (teams as { id: string }[] | null)?.map((t) => t.id) ?? [];

  const { data: matches } = await supabase
    .from("matches")
    .select("round, home_team_id, away_team_id")
    .eq("tournament_id", tournamentIdParsed.data)
    .eq("phase", "regular");
  const existingMatches = (matches as { round: number; home_team_id: string | null; away_team_id: string | null }[] | null) ?? [];

  const teamsWithMatches = new Set(
    existingMatches.flatMap((m) => [m.home_team_id, m.away_team_id]).filter((id): id is string => Boolean(id))
  );
  const newTeamIds = activeTeamIds.filter((id) => !teamsWithMatches.has(id));
  const existingTeamIds = activeTeamIds.filter((id) => teamsWithMatches.has(id));

  if (newTeamIds.length === 0) {
    return { error: "No hay equipos nuevos que agregar al calendario." };
  }

  const pairs: [string, string][] = [];
  for (let i = 0; i < newTeamIds.length; i++) {
    for (const existingId of existingTeamIds) pairs.push([newTeamIds[i], existingId]);
    for (let j = i + 1; j < newTeamIds.length; j++) pairs.push([newTeamIds[i], newTeamIds[j]]);
  }

  const maxRound = existingMatches.reduce((max, m) => Math.max(max, m.round), 0);
  const rows = pairs.map(([a, b], i) => ({
    tournament_id: tournamentIdParsed.data,
    phase: "regular" as const,
    round: maxRound + i + 1,
    leg: 1 as const,
    home_team_id: i % 2 === 0 ? a : b,
    away_team_id: i % 2 === 0 ? b : a,
    status: "scheduled" as const,
  }));

  if (parsed.data.doubleRound) {
    const roundOffset = maxRound + pairs.length;
    pairs.forEach(([a, b], i) => {
      rows.push({
        tournament_id: tournamentIdParsed.data,
        phase: "regular" as const,
        round: roundOffset + i + 1,
        leg: 1 as const,
        home_team_id: i % 2 === 0 ? b : a,
        away_team_id: i % 2 === 0 ? a : b,
        status: "scheduled" as const,
      });
    });
  }

  const { error } = await supabase.from("matches").insert(rows);
  if (error) return { error: "No se pudo extender el calendario." };

  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { error: null, ok: true };
}

export async function createMatchAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const tournamentIdParsed = uuidSchema.safeParse(formData.get("tournamentId"));
  const parsed = matchSchema.safeParse({
    round: formData.get("round"),
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    kickoffAt: formData.get("kickoffAt") || undefined,
    venue: formData.get("venue") || undefined,
  });
  if (!tournamentIdParsed.success) return { error: "Torneo inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase.from("matches").insert({
    tournament_id: tournamentIdParsed.data,
    phase: "regular",
    round: parsed.data.round,
    leg: 1,
    home_team_id: parsed.data.homeTeamId,
    away_team_id: parsed.data.awayTeamId,
    kickoff_at: parsed.data.kickoffAt ? new Date(parsed.data.kickoffAt).toISOString() : null,
    venue: parsed.data.venue || null,
    status: "scheduled",
  });
  if (error) return { error: "No se pudo crear el partido." };

  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { error: null };
}

export async function editMatchAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const matchIdParsed = uuidSchema.safeParse(formData.get("matchId"));
  const parsed = matchSchema.safeParse({
    round: formData.get("round"),
    homeTeamId: formData.get("homeTeamId"),
    awayTeamId: formData.get("awayTeamId"),
    kickoffAt: formData.get("kickoffAt") || undefined,
    venue: formData.get("venue") || undefined,
  });
  if (!matchIdParsed.success) return { error: "Partido inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  const streamUrl = parseStreamUrl(formData.get("streamUrl"));
  if ("error" in streamUrl) return { error: streamUrl.error };

  // Solo se puede editar rival/fecha/jornada mientras el partido no se haya
  // jugado — cambiar los equipos de un partido con resultado dejaría goles
  // huérfanos apuntando al equipo equivocado.
  const { error, data } = await supabase
    .from("matches")
    .update({
      round: parsed.data.round,
      home_team_id: parsed.data.homeTeamId,
      away_team_id: parsed.data.awayTeamId,
      kickoff_at: parsed.data.kickoffAt ? new Date(parsed.data.kickoffAt).toISOString() : null,
      venue: parsed.data.venue || null,
      stream_url: streamUrl.value,
    })
    .eq("id", matchIdParsed.data)
    .neq("status", "played")
    .select()
    .maybeSingle();
  if (error) return { error: "No se pudo actualizar el partido." };
  if (!data) {
    return { error: "Este partido ya se jugó — no se puede editar, solo corregir el resultado." };
  }

  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { error: null, ok: true };
}

export async function setMatchStatusAction(
  matchId: string,
  status: "scheduled" | "postponed"
): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(matchId);

  await supabase.from("matches").update({ status }).eq("id", id).neq("status", "played");
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
}

export async function deleteMatchAction(matchId: string): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(matchId);

  // Solo borra partidos que aún no se jugaron — evita perder un resultado ya capturado.
  await supabase.from("matches").delete().eq("id", id).neq("status", "played");
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
}
