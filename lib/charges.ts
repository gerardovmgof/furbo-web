import "server-only";
import { supabase } from "@/lib/supabase";

/**
 * Marca un cargo pending como paid y, si es de cupos, incrementa
 * player_limit — el mismo camino que usan el webhook de Mercado Pago y
 * "marcar pagado manualmente" del admin. Idempotente: el UPDATE solo afecta
 * la fila si sigue en pending, así que llamarlo dos veces (p. ej. una
 * notificación duplicada del webhook) no incrementa el límite dos veces.
 */
export async function markChargePaid(
  chargeId: string,
  paidVia: "mercadopago" | "manual",
  mpPaymentId?: string
): Promise<void> {
  const { data: charge } = await supabase
    .from("charges")
    .select("id, kind, slots_count, team_id, status")
    .eq("id", chargeId)
    .maybeSingle();
  if (!charge || charge.status !== "pending") return;

  const { data: updated } = await supabase
    .from("charges")
    .update({
      status: "paid",
      paid_via: paidVia,
      ...(mpPaymentId ? { mp_payment_id: mpPaymentId } : {}),
      paid_at: new Date().toISOString(),
    })
    .eq("id", chargeId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (updated && charge.kind === "slots" && charge.slots_count) {
    await supabase.rpc("increment_team_player_limit", {
      p_team_id: charge.team_id,
      p_amount: charge.slots_count,
    });
  }
}
