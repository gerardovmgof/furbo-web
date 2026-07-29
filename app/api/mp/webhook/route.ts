// Webhook de Mercado Pago. Ruta pública (NO pasa por proxy.ts) — Mercado
// Pago la llama directo, sin cookie de sesión. Por eso NUNCA se confía en el
// cuerpo de la notificación: solo dispara una consulta a la API de MP con el
// id recibido, y esa respuesta (nunca el payload entrante) decide qué pasa.
//
// Idempotente: el UPDATE solo afecta el cargo si sigue 'pending'; si otra
// notificación duplicada ya lo marcó 'paid', esta segunda pasada no vuelve
// a incrementar player_limit.

import { getMercadoPagoPayment } from "@/lib/mercadopago";
import { markChargePaid } from "@/lib/charges";

function extractPaymentId(url: URL, body: unknown): string | null {
  const b = body as { type?: string; data?: { id?: string | number } } | null;
  if (b?.data?.id && (!b.type || b.type === "payment")) return String(b.data.id);

  // Notificaciones estilo IPN antiguas / algunas config llegan por query string.
  const queryDataId = url.searchParams.get("data.id");
  const topic = url.searchParams.get("topic") ?? url.searchParams.get("type");
  if (queryDataId && (!topic || topic === "payment")) return queryDataId;

  return null;
}

async function processNotification(request: Request): Promise<Response> {
  const url = new URL(request.url);

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const paymentId = extractPaymentId(url, body);
  if (!paymentId) return new Response("ok", { status: 200 });

  let payment;
  try {
    payment = await getMercadoPagoPayment(paymentId);
  } catch {
    // ID de prueba o transitoriamente no disponible — no hay nada accionable,
    // se responde 200 para que MP no reintente indefinidamente un ID inválido.
    return new Response("ok", { status: 200 });
  }

  if (payment.status !== "approved" || !payment.externalReference) {
    return new Response("ok", { status: 200 });
  }

  await markChargePaid(payment.externalReference, "mercadopago", paymentId);
  return new Response("ok", { status: 200 });
}

export async function POST(request: Request): Promise<Response> {
  return processNotification(request);
}

export async function GET(request: Request): Promise<Response> {
  return processNotification(request);
}
