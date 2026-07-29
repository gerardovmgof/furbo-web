"use server";

import { revalidatePath } from "next/cache";
import { requireTeamOwner } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { registerTeamSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
  ok?: boolean;
}

export async function registerTeamAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireTeamOwner();

  const parsed = registerTeamSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    name: formData.get("name"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  // Nunca confiar en las opciones ya renderizadas del <select>: se revalida
  // aquí que el torneo siga abierto a registro (no haya iniciado fase regular).
  const { data: tournament } = await supabase
    .from("tournaments")
    .select("status")
    .eq("id", parsed.data.tournamentId)
    .maybeSingle();
  if (!tournament || tournament.status !== "draft") {
    return { error: "Ese torneo ya no admite equipos nuevos." };
  }

  const { error } = await supabase.from("teams").insert({
    tournament_id: parsed.data.tournamentId,
    owner_user_id: user.id,
    name: parsed.data.name,
    player_limit: 0,
    status: "active",
  });
  if (error) {
    const message =
      error.code === "23505"
        ? "Ya existe un equipo con ese nombre en ese torneo."
        : "No se pudo registrar el equipo.";
    return { error: message };
  }

  revalidatePath("/equipo");
  return { error: null, ok: true };
}
