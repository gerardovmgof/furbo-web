"use server";

import { revalidatePath } from "next/cache";
import { requireOwnedTeam } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { playerSchema, uuidSchema } from "@/lib/validation";
import { getTournament } from "@/lib/queries";

export interface FormState {
  error: string | null;
}

export async function addPlayerAction(
  teamId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  // El teamId siempre se valida contra teams.owner_user_id aquí, nunca se
  // confía en el que llega del formulario sin pasar por requireOwnedTeam.
  const { user, team } = await requireOwnedTeam(teamId);

  const parsed = playerSchema.safeParse({
    name: formData.get("name"),
    jerseyNumber: formData.get("jerseyNumber"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  if (team.status !== "active") {
    return { error: "Tu equipo no está activo en este momento." };
  }
  const tournament = await getTournament(team.tournament_id);
  if (!tournament?.registration_open) {
    return { error: "El registro de jugadores está cerrado." };
  }

  // RPC atómica: el chequeo del límite corre dentro de una transacción con
  // FOR UPDATE — dos altas simultáneas no pueden rebasar player_limit.
  const { error } = await supabase.rpc("create_player_atomic", {
    p_team_id: team.id,
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

  revalidatePath(`/equipo/${teamId}/plantilla`);
  return { error: null };
}

export async function deactivatePlayerAction(teamId: string, playerId: string): Promise<void> {
  const { team } = await requireOwnedTeam(teamId);
  const id = uuidSchema.parse(playerId);

  // Ownership check en el WHERE: solo se puede dar de baja un jugador del
  // propio equipo, sin importar qué id llegue del formulario.
  await supabase.from("players").update({ active: false }).eq("id", id).eq("team_id", team.id);

  revalidatePath(`/equipo/${teamId}/plantilla`);
}
