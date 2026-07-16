"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { scoreSchema, uuidSchema } from "@/lib/validation";

export interface FormState {
  error: string | null;
}

export async function captureResultAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();

  const matchIdParsed = uuidSchema.safeParse(formData.get("matchId"));
  if (!matchIdParsed.success) return { error: "Partido inválido." };

  const parsed = scoreSchema.safeParse({
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Marcador inválido." };
  }
  const isForfeit = formData.get("isForfeit") === "on";
  const matchId = matchIdParsed.data;

  const { error: matchError } = await supabase
    .from("matches")
    .update({
      status: "played",
      is_forfeit: isForfeit,
      home_score: parsed.data.homeScore,
      away_score: parsed.data.awayScore,
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
  return { error: null };
}
