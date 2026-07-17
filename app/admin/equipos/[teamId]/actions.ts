"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { editPlayerSchema, uuidSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
}

export async function editPlayerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const teamIdParsed = uuidSchema.safeParse(formData.get("teamId"));
  const parsed = editPlayerSchema.safeParse({
    playerId: formData.get("playerId"),
    name: formData.get("name"),
    jerseyNumber: formData.get("jerseyNumber"),
  });
  if (!teamIdParsed.success) return { error: "Equipo inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase
    .from("players")
    .update({ name: parsed.data.name, jersey_number: parsed.data.jerseyNumber })
    .eq("id", parsed.data.playerId)
    .eq("team_id", teamIdParsed.data);
  if (error) {
    const message =
      error.code === "23505" ? "Ese dorsal ya está en uso en este equipo." : "No se pudo actualizar al jugador.";
    return { error: message };
  }

  revalidatePath(`/admin/equipos/${teamIdParsed.data}`);
  return { error: null };
}

export async function deactivatePlayerAction(teamId: string, playerId: string): Promise<void> {
  await requireAdmin();
  const team = uuidSchema.parse(teamId);
  const id = uuidSchema.parse(playerId);

  await supabase.from("players").update({ active: false }).eq("id", id).eq("team_id", team);
  revalidatePath(`/admin/equipos/${team}`);
}
