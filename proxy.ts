// Primera barrera de autorización (corre en edge, ANTES de renderizar).
// Solo verifica firma HMAC + expiración + rol de la cookie — NO toca la base
// de datos (bcrypt y Supabase no existen en este runtime). La revalidación
// real contra DB (token_version, existencia del usuario) ocurre en cada
// Server Action vía lib/auth.ts. No confiar en esta capa para seguridad final.

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const payload = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);

  const requiredRole = pathname.startsWith("/admin") ? "admin" : "team";

  if (!payload || payload.role !== requiredRole) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/equipo/:path*"],
};
