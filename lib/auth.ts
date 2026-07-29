// Autenticación y autorización del lado del servidor.
// REGLA DE ORO: toda Server Action / route handler que mute datos llama
// requireAdmin() o requireTeamUser() ANTES de tocar la base de datos.
// El proxy.ts es solo la primera barrera (UX); esta capa es la que manda.

import "server-only";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { supabase } from "@/lib/supabase";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signSession,
  verifySession,
} from "@/lib/session";
import { isLoginBlocked, recordLoginAttempt, clientIpFromHeaders } from "@/lib/ratelimit";
import type { SessionPayload, UserRow } from "@/lib/types";

// Hash dummy (de una contraseña aleatoria descartada): cuando el usuario no
// existe se compara contra esto para que el tiempo de respuesta no revele
// si el username es válido (anti-enumeración).
const DUMMY_HASH = "$2b$12$wS9r6wQ5Yyd7aR1VzWWRIuPtp/G2Yfl26o819K1d.m3SbOl0RUUl2";

export type LoginResult =
  | { ok: true; role: "admin" | "team" | "referee" }
  | { ok: false; error: string };

export async function login(username: string, password: string): Promise<LoginResult> {
  const ip = clientIpFromHeaders(await headers());
  const normalized = username.trim().toLowerCase();

  if (await isLoginBlocked(ip, normalized)) {
    return { ok: false, error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." };
  }

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("username", normalized)
    .maybeSingle<UserRow>();

  const hash = user?.password_hash ?? DUMMY_HASH;
  const passwordOk = await bcrypt.compare(password, hash);

  if (!user || !passwordOk) {
    await recordLoginAttempt(ip, normalized, false);
    // Mensaje único exista o no el usuario (anti-enumeración).
    return { ok: false, error: "Usuario o contraseña incorrectos." };
  }

  await recordLoginAttempt(ip, normalized, true);

  const payload: SessionPayload = {
    uid: user.id,
    role: user.role,
    teamId: user.team_id,
    tv: user.token_version,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS,
  };

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, await signSession(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true, role: user.role };
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

/**
 * Devuelve el usuario autenticado REVALIDADO contra la base de datos
 * (firma de cookie + existencia + token_version), o null.
 */
export async function getSessionUser(): Promise<UserRow | null> {
  const cookieStore = await cookies();
  const payload = await verifySession(cookieStore.get(SESSION_COOKIE)?.value);
  if (!payload) return null;

  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("id", payload.uid)
    .maybeSingle<UserRow>();

  if (!user) return null;
  // token_version distinto = contraseña reseteada → sesión inválida.
  if (user.token_version !== payload.tv) return null;

  return user;
}

/** Para Server Actions de admin. Redirige a /login si no hay admin válido. */
export async function requireAdmin(): Promise<UserRow> {
  const user = await getSessionUser();
  if (!user || user.role !== "admin") redirect("/login");
  return user;
}

/**
 * Para Server Actions de delegados de equipo. Redirige a /login si no hay
 * usuario de equipo válido. El team_id para CUALQUIER mutación debe salir
 * de la fila devuelta aquí — jamás de un input del cliente.
 */
export async function requireTeamUser(): Promise<UserRow & { team_id: string }> {
  const user = await getSessionUser();
  if (!user || user.role !== "team" || !user.team_id) redirect("/login");
  return user as UserRow & { team_id: string };
}

/** Para Server Actions exclusivas de árbitros (sección /arbitro). */
export async function requireReferee(): Promise<UserRow> {
  const user = await getSessionUser();
  if (!user || user.role !== "referee") redirect("/login");
  return user;
}

/**
 * Para acciones compartidas entre admin y árbitro (captura de resultados):
 * ambos roles pueden capturar, pero la propia action debe restringir qué
 * puede hacer cada uno (p. ej. corregir un partido ya jugado es solo admin).
 */
export async function requireAdminOrReferee(): Promise<UserRow> {
  const user = await getSessionUser();
  if (!user || (user.role !== "admin" && user.role !== "referee")) redirect("/login");
  return user;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}
