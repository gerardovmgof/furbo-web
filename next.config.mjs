// Headers de seguridad.
// form-action necesita los dominios de checkout de Mercado Pago: los
// Server Actions de pago responden con un redirect (303) hacia ahí, y sin
// esos hosts en la whitelist el navegador bloquea la redirección en
// silencio (el server sí crea la preferencia bien, pero el click "no hace
// nada" — así se manifestó este bug la primera vez).
//
// script-src necesita 'unsafe-inline': Next.js App Router (RSC streaming)
// inyecta sus propios <script> inline en cada respuesta para ir mandando
// el payload de React Server Components según llega — self.__next_f.push(...)
// — y su contenido cambia en cada request, así que no se puede fijar por
// hash como el anti-flash de tema de abajo. Se descubrió que la CSP previa
// (script-src 'self' a secas, sin 'unsafe-inline' ni nonce) bloqueaba esos
// scripts en silencio: el HTML servía bien, pero React nunca hidrataba en
// el navegador (ningún botón/toggle/tab activo funcionaba, sin error
// visible en consola — el navegador no llegaba ni a loguear el bloqueo).
// Pasó desapercibido porque casi todo el sitio ya funciona sin JS por
// diseño (ver PRODUCT.md, principio #5). La alternativa correcta sin
// 'unsafe-inline' es CSP por nonce vía proxy.ts, pero eso obliga a
// renderizado dinámico en TODO el sitio (adiós a las páginas públicas
// estáticas) — no vale la pena para lo que gana en este proyecto.
// 'unsafe-eval' solo en dev: React lo usa ahí para reconstruir stack traces
// al debuggear (nunca en producción) — sin esto, `npm run dev` no hidrata
// tampoco (falla en un paso posterior con "eval() is not supported").
const isDev = process.env.NODE_ENV === "development";

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://www.mercadopago.com.mx https://sandbox.mercadopago.com.mx;
  frame-ancestors 'none';
  upgrade-insecure-requests;
`
  .replace(/\s{2,}/g, " ")
  .trim();

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Content-Security-Policy", value: cspHeader },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
