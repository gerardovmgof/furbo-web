// Cliente de Mercado Pago (Checkout Pro): solo se usa en el servidor. Nunca
// exponer MP_ACCESS_TOKEN al navegador. Patrón lazy igual que lib/supabase.ts
// — se crea al primer uso real, no al importar el módulo.
//
// Mientras la organizadora no tenga cuenta propia de Mercado Pago, MP_ACCESS_TOKEN
// debe ser un access token de PRUEBA (sandbox) — ver README del setup en CLAUDE.md.

import "server-only";
import { MercadoPagoConfig, Preference, Payment } from "mercadopago";

let config: MercadoPagoConfig | null = null;

function getConfig(): MercadoPagoConfig {
  if (config) return config;
  const accessToken = process.env.MP_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error("Falta MP_ACCESS_TOKEN en las variables de entorno.");
  }
  config = new MercadoPagoConfig({ accessToken });
  return config;
}

function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    throw new Error("Falta NEXT_PUBLIC_SITE_URL en las variables de entorno.");
  }
  return siteUrl.replace(/\/$/, "");
}

/**
 * Crea una preferencia de pago para un cargo (charge) pendiente y devuelve
 * la URL de checkout a la que se debe redirigir al dueño de equipo.
 */
export async function createChargePreference(params: {
  chargeId: string;
  title: string;
  amountCents: number;
}): Promise<{ preferenceId: string; initPoint: string }> {
  const siteUrl = getSiteUrl();
  const preference = new Preference(getConfig());

  const result = await preference.create({
    body: {
      items: [
        {
          id: params.chargeId,
          title: params.title,
          quantity: 1,
          unit_price: Math.round(params.amountCents) / 100,
          currency_id: "MXN",
        },
      ],
      external_reference: params.chargeId,
      notification_url: `${siteUrl}/api/mp/webhook`,
      back_urls: {
        success: `${siteUrl}/equipo/pagos?resultado=ok`,
        failure: `${siteUrl}/equipo/pagos?resultado=error`,
        pending: `${siteUrl}/equipo/pagos?resultado=pendiente`,
      },
      auto_return: "approved",
    },
  });

  const initPoint = result.init_point ?? result.sandbox_init_point;
  if (!result.id || !initPoint) {
    throw new Error("Mercado Pago no devolvió una preferencia de pago válida.");
  }
  return { preferenceId: result.id, initPoint };
}

/**
 * Consulta un pago DIRECTO en la API de Mercado Pago — nunca se confía en
 * el cuerpo de la notificación del webhook, solo en esta consulta.
 */
export async function getMercadoPagoPayment(paymentId: string): Promise<{
  status: string;
  externalReference: string | null;
}> {
  const payment = new Payment(getConfig());
  const result = await payment.get({ id: paymentId });
  return {
    status: result.status ?? "unknown",
    externalReference: result.external_reference ?? null,
  };
}
