"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { setSlotPriceSchema, createChargeSchema, uuidSchema, toCents } from "@/lib/validation";
import { markChargePaid } from "@/lib/charges";

export interface FormState {
  error: string | null;
  ok?: boolean;
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
  return { error: null, ok: true };
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

  await markChargePaid(id, "manual");
  revalidatePath("/admin/cobros");
}

export async function cancelChargeAction(chargeId: string): Promise<void> {
  await requireAdmin();
  const id = uuidSchema.parse(chargeId);

  await supabase.from("charges").update({ status: "canceled" }).eq("id", id).eq("status", "pending");
  revalidatePath("/admin/cobros");
}
