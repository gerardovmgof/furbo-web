// Rate limiting de login sobre la tabla login_attempts (Postgres).
// Regla: ≥5 fallos por username O ≥20 fallos por IP en los últimos 15 minutos → bloquear.

import "server-only";
import { supabase } from "@/lib/supabase";

const WINDOW_MINUTES = 15;
const MAX_FAILS_PER_USERNAME = 5;
const MAX_FAILS_PER_IP = 20;

function windowStart(): string {
  return new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
}

export async function isLoginBlocked(ip: string, username: string): Promise<boolean> {
  const since = windowStart();

  const [byUser, byIp] = await Promise.all([
    supabase
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("username", username)
      .eq("success", false)
      .gte("attempted_at", since),
    supabase
      .from("login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("attempted_at", since),
  ]);

  // Si la consulta falla, preferimos bloquear a dejar pasar un ataque a ciegas.
  if (byUser.error || byIp.error) return true;

  return (
    (byUser.count ?? 0) >= MAX_FAILS_PER_USERNAME || (byIp.count ?? 0) >= MAX_FAILS_PER_IP
  );
}

export async function recordLoginAttempt(
  ip: string,
  username: string,
  success: boolean
): Promise<void> {
  await supabase.from("login_attempts").insert({ ip, username, success });

  // Limpieza oportunista: borra intentos de hace más de 24h (sin bloquear el login si falla).
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  void supabase.from("login_attempts").delete().lt("attempted_at", dayAgo);
}

/** Primer valor de x-forwarded-for (Vercel lo setea con la IP real del cliente). */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
