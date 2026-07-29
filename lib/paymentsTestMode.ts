// ⚠️ TEMPORAL — mientras Gerardo no tenga acceso a Vercel (bloqueado por 2FA)
// para configurar un MP_ACCESS_TOKEN real, este flag salta la pasarela de
// Mercado Pago: los botones de pago marcan el cargo como pagado de inmediato
// (paid_via = "manual") en vez de redirigir a Mercado Pago, para poder seguir
// probando el resto de la app (compra de cupos, cargos de renta, etc.).
//
// Ponlo en `false` en cuanto MP_ACCESS_TOKEN esté configurado en producción
// — y en cuanto ya no haga falta, borra este archivo y los usos en
// lib/actions/payments.ts y app/equipo/[teamId]/pagos/page.tsx.
export const SKIP_MERCADOPAGO_FOR_TESTING = true;
