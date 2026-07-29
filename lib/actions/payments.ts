"use server";

// Acciones de pago del lado del dueño de equipo: comprar cupos y pagar
// cargos pendientes. En ambos casos el team_id sale SIEMPRE de la sesión
// (requireTeamUser), nunca de un input del formulario.

import { redirect } from "next/navigation";
import { requireTeamUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getTournament } from "@/lib/queries";
import { buySlotsSchema, uuidSchema } from "@/lib/validation";
import { createChargePreference } from "@/lib/mercadopago";

export interface FormState {
  error: string | null;
}

export async function buySlotsAction(
  _prev: FormState,
  formData: FormData
): Promise<FormState> {
  const user = await requireTeamUser();

  const parsed = buySlotsSchema.safeParse({ slotsCount: formData.get("slotsCount") });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  const { data: team } = await supabase
    .from("teams")
    .select("id, tournament_id, status")
    .eq("id", user.team_id)
    .maybeSingle();
  if (!team || team.status !== "active") {
    return { error: "Tu equipo no está activo." };
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

  let initPoint: string;
  try {
    const preference = await createChargePreference({
      chargeId: charge.id,
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

export async function payChargeAction(chargeId: string): Promise<void> {
  const user = await requireTeamUser();
  const idParsed = uuidSchema.safeParse(chargeId);
  if (!idParsed.success) redirect("/equipo/pagos?resultado=error");

  const { data: charge } = await supabase
    .from("charges")
    .select("id, concept, amount_cents")
    .eq("id", idParsed.data)
    .eq("team_id", user.team_id) // el dueño de equipo SOLO paga cargos de SU equipo
    .eq("status", "pending")
    .maybeSingle();
  if (!charge) redirect("/equipo/pagos?resultado=error");

  let initPoint: string;
  try {
    const preference = await createChargePreference({
      chargeId: charge.id,
      title: charge.concept,
      amountCents: charge.amount_cents,
    });
    initPoint = preference.initPoint;
    await supabase
      .from("charges")
      .update({ mp_preference_id: preference.preferenceId })
      .eq("id", charge.id);
  } catch {
    redirect("/equipo/pagos?resultado=error");
  }

  redirect(initPoint);
}
