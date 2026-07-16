"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { matchSchema, uuidSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
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
