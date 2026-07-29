"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { teamSchema, uuidSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
}

/** "" (opción "Sin dueño") -> null; si viene algo, debe ser un uuid válido. */
function parseOwnerUserId(raw: FormDataEntryValue | null): { value: string | null } | { error: string } {
  const trimmed = typeof raw === "string" ? raw.trim() : "";
  if (!trimmed) return { value: null };
  const parsed = uuidSchema.safeParse(trimmed);
  if (!parsed.success) return { error: "Dueño inválido." };
  return { value: parsed.data };
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
  const ownerUserId = parseOwnerUserId(formData.get("ownerUserId"));
  if (!tournamentIdParsed.success) return { error: "Torneo inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  if ("error" in ownerUserId) return { error: ownerUserId.error };

  const { error } = await supabase.from("teams").insert({
    tournament_id: tournamentIdParsed.data,
    owner_user_id: ownerUserId.value,
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

export async function editTeamAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const idParsed = uuidSchema.safeParse(formData.get("teamId"));
  const parsed = teamSchema.safeParse({
    name: formData.get("name"),
    playerLimit: formData.get("playerLimit"),
  });
  const ownerUserId = parseOwnerUserId(formData.get("ownerUserId"));
  if (!idParsed.success) return { error: "Equipo inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }
  if ("error" in ownerUserId) return { error: ownerUserId.error };

  const { count } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .eq("team_id", idParsed.data)
    .eq("active", true);
  if ((count ?? 0) > parsed.data.playerLimit) {
    return {
      error: `Ya hay ${count} jugadores registrados; el límite no puede ser menor a eso.`,
    };
  }

  const { error } = await supabase
    .from("teams")
    .update({
      name: parsed.data.name,
      player_limit: parsed.data.playerLimit,
      owner_user_id: ownerUserId.value,
    })
    .eq("id", idParsed.data);
  if (error) {
    const message =
      error.code === "23505" ? "Ya existe un equipo con ese nombre en este torneo." : "No se pudo actualizar el equipo.";
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
