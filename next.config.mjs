// Headers de seguridad. Sin scripts/estilos de terceros (next/font/google
// se auto-hospeda en build), así que la CSP puede ser estricta sin nonces.
// form-action necesita los dominios de checkout de Mercado Pago: los
// Server Actions de pago responden con un redirect (303) hacia ahí, y sin
// esos hosts en la whitelist el navegador bloquea la redirección en
// silencio (el server sí crea la preferencia bien, pero el click "no hace
// nada" — así se manifestó este bug la primera vez).
const cspHeader = `
  default-src 'self';
  script-src 'self';
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
