// Firma y verificación de la cookie de sesión `furbo_session`.
// SOLO usa Web Crypto (crypto.subtle) para que proxy.ts (runtime edge)
// pueda verificar la firma — aquí NO se importa bcrypt ni Supabase.
//
// Formato: base64url(JSON payload) + "." + base64url(HMAC-SHA256(payload, SESSION_SECRET))

import type { SessionPayload } from "@/lib/types";

export const SESSION_COOKIE = "furbo_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 días

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("SESSION_SECRET ausente o demasiado corto (mínimo 32 caracteres).");
  }
  return secret;
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

async function hmac(data: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

/** Comparación en tiempo constante para evitar timing attacks sobre la firma. */
function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

export async function signSession(payload: SessionPayload): Promise<string> {
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = toBase64Url(await hmac(body));
  return `${body}.${signature}`;
}

/**
 * Verifica firma y expiración. Devuelve el payload o null si es inválida.
 * OJO: esto NO valida token_version contra la base de datos — eso lo hace
 * lib/auth.ts en cada Server Action. El proxy solo usa esta verificación.
 */
export async function verifySession(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const providedSig = fromBase64Url(token.slice(dot + 1));
  if (!providedSig) return null;

  const expectedSig = await hmac(body);
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  const bodyBytes = fromBase64Url(body);
  if (!bodyBytes) return null;

  let payload: SessionPayload;
  try {
    payload = JSON.parse(new TextDecoder().decode(bodyBytes)) as SessionPayload;
  } catch {
    return null;
  }

  if (
    typeof payload.uid !== "string" ||
    (payload.role !== "admin" && payload.role !== "team") ||
    typeof payload.tv !== "number" ||
    typeof payload.exp !== "number"
  ) {
    return null;
  }

  if (payload.exp * 1000 < Date.now()) return null;

  return payload;
}
