"use server";

import { revalidatePath } from "next/cache";
import { requireTeamUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { playerSchema, uuidSchema } from "@/lib/validation";
import { getTeam, getTournament } from "@/lib/queries";

export interface FormState {
  error: string | null;
}

export async function addPlayerAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  // team_id SIEMPRE sale de la sesión validada en DB, nunca del formulario.
  const user = await requireTeamUser();

  const parsed = playerSchema.safeParse({
    name: formData.get("name"),
    jerseyNumber: formData.get("jerseyNumber"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const team = await getTeam(user.team_id);
  if (!team || team.status !== "active") {
    return { error: "Tu equipo no está activo en este momento." };
  }
  const tournament = await getTournament(team.tournament_id);
  if (!tournament?.registration_open) {
    return { error: "El registro de jugadores está cerrado." };
  }

  // RPC atómica: el chequeo del límite corre dentro de una transacción con
  // FOR UPDATE — dos altas simultáneas no pueden rebasar player_limit.
  const { error } = await supabase.rpc("create_player_atomic", {
    p_team_id: user.team_id,
    p_name: parsed.data.name,
    p_jersey: parsed.data.jerseyNumber,
    p_created_by: user.id,
  });

  if (error) {
    if (error.message.includes("PLAYER_LIMIT_REACHED")) {
      return { error: "Ya alcanzaste el límite de jugadores registrados de tu equipo." };
    }
    if (error.message.includes("TEAM_NOT_ACTIVE")) {
      return { error: "Tu equipo no está activo en este momento." };
    }
    if (error.code === "23505") {
      return { error: "Ese dorsal ya está en uso en tu equipo." };
    }
    return { error: "No se pudo registrar al jugador." };
  }

  revalidatePath("/equipo/plantilla");
  return { error: null };
}

export async function deactivatePlayerAction(playerId: string): Promise<void> {
  const user = await requireTeamUser();
  const id = uuidSchema.parse(playerId);

  // Ownership check en el WHERE: solo se puede dar de baja un jugador del
  // propio equipo, sin importar qué id llegue del formulario.
  await supabase
    .from("players")
    .update({ active: false })
    .eq("id", id)
    .eq("team_id", user.team_id);

  revalidatePath("/equipo/plantilla");
}
