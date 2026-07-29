"use server";

// Acciones de pago del lado del dueño de equipo: comprar cupos y pagar
// cargos pendientes. En ambos casos el teamId llega por parámetro (un dueño
// puede tener varios equipos) pero SIEMPRE se valida contra
// teams.owner_user_id vía requireOwnedTeam antes de usarse.

import { redirect } from "next/navigation";
import { requireOwnedTeam } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getTournament } from "@/lib/queries";
import { buySlotsSchema, uuidSchema } from "@/lib/validation";
import { createChargePreference } from "@/lib/mercadopago";
import { markChargePaid } from "@/lib/charges";
import { SKIP_MERCADOPAGO_FOR_TESTING } from "@/lib/paymentsTestMode";

export interface FormState {
  error: string | null;
}

export async function buySlotsAction(
  teamId: string,
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const { user, team } = await requireOwnedTeam(teamId);
  if (team.status !== "active") {
    return { error: "Tu equipo no está activo." };
  }

  const parsed = buySlotsSchema.safeParse({ slotsCount: formData.get("slotsCount") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const tournament = await getTournament(team.tournament_id);
  if (!tournament?.slot_price_cents) {
    return { error: "La compra de cupos no está habilitada para este torneo." };
  }

  const amountCents = parsed.data.slotsCount * tournament.slot_price_cents;
  const concept = `Compra de ${parsed.data.slotsCount} cupo(s) de jugador`;

  const { data: charge, error: insertError } = await supabase
    .from("charges")
    .insert({
      tournament_id: team.tournament_id,
      team_id: team.id,
      kind: "slots",
      concept,
      slots_count: parsed.data.slotsCount,
      amount_cents: amountCents,
      status: "pending",
      created_by: user.id,
    })
    .select()
    .single();
  if (insertError || !charge) return { error: "No se pudo crear el cargo." };

  if (SKIP_MERCADOPAGO_FOR_TESTING) {
    await markChargePaid(charge.id, "manual");
    redirect(`/equipo/${teamId}/pagos?resultado=ok`);
  }

  let initPoint: string;
  try {
    const preference = await createChargePreference({
      chargeId: charge.id,
      teamId: team.id,
      title: concept,
      amountCents,
    });
    initPoint = preference.initPoint;
    await supabase
      .from("charges")
      .update({ mp_preference_id: preference.preferenceId })
      .eq("id", charge.id);
  } catch {
    return {
      error: "No se pudo iniciar el pago con Mercado Pago. Intenta de nuevo en unos minutos.",
    };
  }

  redirect(initPoint);
}

export async function payChargeAction(teamId: string, chargeId: string): Promise<void> {
  const { team } = await requireOwnedTeam(teamId);
  const idParsed = uuidSchema.safeParse(chargeId);
  if (!idParsed.success) redirect(`/equipo/${teamId}/pagos?resultado=error`);

  const { data: charge } = await supabase
    .from("charges")
    .select("id, concept, amount_cents")
    .eq("id", idParsed.data)
    .eq("team_id", team.id) // el dueño de equipo SOLO paga cargos de SU equipo
    .eq("status", "pending")
    .maybeSingle();
  if (!charge) redirect(`/equipo/${teamId}/pagos?resultado=error`);

  if (SKIP_MERCADOPAGO_FOR_TESTING) {
    await markChargePaid(charge.id, "manual");
    redirect(`/equipo/${teamId}/pagos?resultado=ok`);
  }

  let initPoint: string;
  try {
    const preference = await createChargePreference({
      chargeId: charge.id,
      teamId,
      title: charge.concept,
      amountCents: charge.amount_cents,
    });
    initPoint = preference.initPoint;
    await supabase
      .from("charges")
      .update({ mp_preference_id: preference.preferenceId })
      .eq("id", charge.id);
  } catch {
    redirect(`/equipo/${teamId}/pagos?resultado=error`);
  }

  redirect(initPoint);
}
