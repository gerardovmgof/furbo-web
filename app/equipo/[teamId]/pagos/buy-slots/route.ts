// Route Handler (NO Server Action) a propósito: el destino final es un
// dominio externo (Mercado Pago). Un <form method="POST"> normal apuntando
// aquí siempre hace una navegación real del navegador — un Server Action
// invocado vía fetch() (que es como React lo llama en cuanto hay JS activo)
// NO puede seguir una redirección hacia otro origen por las reglas de CORS
// del navegador, así que el redirect fallaba en silencio ("Connection
// closed") aunque el servidor sí creaba la preferencia de pago bien.
import { NextRequest, NextResponse } from "next/server";
import { requireOwnedTeam } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getTournament } from "@/lib/queries";
import { buySlotsSchema } from "@/lib/validation";
import { createChargePreference } from "@/lib/mercadopago";
import { markChargePaid } from "@/lib/charges";
import { SKIP_MERCADOPAGO_FOR_TESTING } from "@/lib/paymentsTestMode";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const { user, team } = await requireOwnedTeam(teamId);
  const formData = await request.formData();

  const errorRedirect = () =>
    NextResponse.redirect(new URL(`/equipo/${teamId}/pagos?resultado=error`, request.url), 303);

  if (team.status !== "active") return errorRedirect();

  const parsed = buySlotsSchema.safeParse({ slotsCount: formData.get("slotsCount") });
  if (!parsed.success) return errorRedirect();

  const tournament = await getTournament(team.tournament_id);
  if (!tournament?.slot_price_cents) return errorRedirect();

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
  if (insertError || !charge) return errorRedirect();

  if (SKIP_MERCADOPAGO_FOR_TESTING) {
    await markChargePaid(charge.id, "manual");
    return NextResponse.redirect(new URL(`/equipo/${teamId}/pagos?resultado=ok`, request.url), 303);
  }

  try {
    const preference = await createChargePreference({
      chargeId: charge.id,
      teamId: team.id,
      title: concept,
      amountCents,
    });
    await supabase
      .from("charges")
      .update({ mp_preference_id: preference.preferenceId })
      .eq("id", charge.id);
    return NextResponse.redirect(preference.initPoint, 303);
  } catch {
    return errorRedirect();
  }
}
