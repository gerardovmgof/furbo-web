// Route Handler (NO Server Action) — mismo motivo que buy-slots/route.ts:
// el redirect final es a un dominio externo (Mercado Pago) y eso necesita
// una navegación real de formulario, no un fetch() interceptado por React.
import { NextRequest, NextResponse } from "next/server";
import { requireOwnedTeam } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { uuidSchema } from "@/lib/validation";
import { createChargePreference } from "@/lib/mercadopago";
import { markChargePaid } from "@/lib/charges";
import { SKIP_MERCADOPAGO_FOR_TESTING } from "@/lib/paymentsTestMode";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const { teamId } = await params;
  const { team } = await requireOwnedTeam(teamId);
  const formData = await request.formData();

  const errorRedirect = () =>
    NextResponse.redirect(new URL(`/equipo/${teamId}/pagos?resultado=error`, request.url), 303);

  const idParsed = uuidSchema.safeParse(formData.get("chargeId"));
  if (!idParsed.success) return errorRedirect();

  const { data: charge } = await supabase
    .from("charges")
    .select("id, concept, amount_cents")
    .eq("id", idParsed.data)
    .eq("team_id", team.id) // el dueño de equipo SOLO paga cargos de SU equipo
    .eq("status", "pending")
    .maybeSingle();
  if (!charge) return errorRedirect();

  if (SKIP_MERCADOPAGO_FOR_TESTING) {
    await markChargePaid(charge.id, "manual");
    return NextResponse.redirect(new URL(`/equipo/${teamId}/pagos?resultado=ok`, request.url), 303);
  }

  try {
    const preference = await createChargePreference({
      chargeId: charge.id,
      teamId,
      title: charge.concept,
      amountCents: charge.amount_cents,
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
