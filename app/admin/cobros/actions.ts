"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { setSlotPriceSchema, createChargeSchema, uuidSchema, toCents } from "@/lib/validation";

export interface FormState {
  error: string | null;
}

export async function setSlotPriceAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  await requireAdmin();

  const parsed = setSlotPriceSchema.safeParse({
    tournamentId: formData.get("tournamentId"),
    slotPrice: formData.get("slotPrice"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const slotPriceCents = toCents(parsed.data.slotPrice);
  const { error } = await supabase
    .from("tournaments")
    .update({
      // 0 = deshabilitar la compra de cupos para este torneo.
      slot_price_cents: slotPriceCents === 0 ? null : slotPriceCents,
    })
    .eq("id", parsed.data.tournamentId);
  if (error) return { error: "No se pudo actualizar el precio del cupo." };

  revalidatePath("/admin/cobros");
  return { error: null };
}

export async function createChargeAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const admin = await requireAdmin();

  const tournamentIdParsed = uuidSchema.safeParse(formData.get("tournamentId"));
  const parsed = createChargeSchema.safeParse({
    teamId: formData.get("teamId"),
    concept: formData.get("concept"),
    amount: formData.get("amount"),
  });
  if (!tournamentIdParsed.success) return { error: "Torneo inválido." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { error } = await supabase.from("charges").insert({
    tournament_id: tournamentIdParsed.data,
    team_id: parsed.data.teamId,
    kind: "rent",
    concept: parsed.data.concept,
    amount_cents: toCents(parsed.data.amount),
    status: "pending",
    created_by: admin.id,
  });
  if (error) return { error: "No se pudo crear el cargo." };

  revalidatePath("/admin/cobros");
  return { error: null };
}

/**
 * Escape para pagos fuera de la app (efectivo/transferencia), igual que
 * siempre — la diferencia es que ahora conviven con el flujo de Mercado Pago.
 * Si el cargo es de cupos, incrementa player_limit igual que el webhook.
 */
export async function markChargePaidManuallyAction(chargeId: string): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(chargeId);

  const { data: charge } = await supabase
    .from("charges")
    .select("id, kind, slots_count, team_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!charge || charge.status !== "pending") {
    revalidatePath("/admin/cobros");
    return;
  }

  const { data: updated } = await supabase
    .from("charges")
    .update({ status: "paid", paid_via: "manual", paid_at: new Date().toISOString() })
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updated && charge.kind === "slots" && charge.slots_count) {
    await supabase.rpc("increment_team_player_limit", {
      p_team_id: charge.team_id,
      p_amount: charge.slots_count,
    });
  }

  revalidatePath("/admin/cobros");
}

export async function cancelChargeAction(chargeId: string): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(chargeId);

  await supabase.from("charges").update({ status: "canceled" }).eq("id", id).eq("status", "pending");
  revalidatePath("/admin/cobros");
}
