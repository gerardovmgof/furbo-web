"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { teamSchema, uuidSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
}

export async function createTeamAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const tournamentIdParsed = uuidSchema.safeParse(formData.get("tournamentId"));
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    playerLimit: formData.get("playerLimit"),
  });
  if (!tournamentIdParsed.success) return { error: "Torneo inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase.from("teams").insert({
    tournament_id: tournamentIdParsed.data,
    name: parsed.data.name,
    player_limit: parsed.data.playerLimit,
    status: "active",
  });
  if (error) {
    const message = error.code === "23505" ? "Ya existe un equipo con ese nombre en este torneo." : "No se pudo crear el equipo.";
    return { error: message };
  }

  revalidatePath("/admin/equipos");
  return { error: null };
}

export async function setTeamStatusAction(
  teamId: string,
  status: "active" | "withdrawn"
): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(teamId);

  await supabase.from("teams").update({ status }).eq("id", id);
  revalidatePath("/admin/equipos");
}
