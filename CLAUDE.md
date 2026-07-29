@AGENTS.md

# Furbo Web

Plataforma web para gestión de ligas de fútbol amateur. Cliente real: una organizadora de liga en Querétaro.

## Qué pidió la clienta

- **Tabla de goleo, tabla de posiciones y calendario** de la liga, visibles para todos sin login.
- En la tabla de posiciones: desglose (JJ, JG, JE, JP, GF, GC, DIF, PTS). Referencia visual: las tablas de la app "Benjamín".
- **Control de registros pagados**: la organizadora vende N registros a un equipo; el equipo solo puede dar de alta N jugadores. El cobro es FUERA de la app (efectivo/transferencia) — la app NO maneja pagos ni datos bancarios, NUNCA.
- Fase regular por jornadas + **liguilla/bracket** al final (4 u 8 equipos, ida/vuelta opcional, final a partido único).

## Modelo de usuarios (decisión final — NO implementar "códigos de registro")

> La idea original era dar "códigos" a los equipos. Se descartó. El modelo vigente es:

- **admin** (la organizadora): da de alta torneos, equipos (con `player_limit` = registros pagados) directamente si quiere, **crea usuarios "dueño de equipo" sin equipo asignado** (solo usuario + contraseña — el equipo lo registra el propio dueño), arma calendario (manual o sorteado), captura resultados y goles, genera la liguilla, resetea contraseñas, gestiona cobros. Si un torneo ya inició y hace falta sumar un equipo, el admin lo agrega en "Equipos" y luego lo incorpora al calendario ya generado desde la card "Agregar equipos nuevos al calendario" en `/admin/calendario` (extensión NO destructiva: solo agrega jornadas nuevas con los cruces del equipo nuevo, no borra ni reordena los partidos existentes).
- **team** ("dueño de equipo" en la UI; el valor en DB sigue siendo `team`): al iniciar sesión sin equipos ve un formulario de autorregistro (`/equipo`) — elige un torneo **en `draft`** (no iniciado) con precio de cupo configurado, pone el nombre de su equipo, y el equipo nace con `player_limit = 0`. **Un mismo dueño puede tener varios equipos** (`teams.owner_user_id`, uno-a-muchos — NO hay `users.team_id`, un dueño no está ligado a un solo equipo). Cada equipo vive en `/equipo/[teamId]/plantilla` y `/equipo/[teamId]/pagos`; ahí registra/edita/da de baja jugadores SOLO de ESE equipo hasta `player_limit`, y compra cupos / paga cargos vía Mercado Pago (comprar cupos es como sube el límite desde 0). El admin también puede crear un equipo directo y ligarlo a un dueño existente (o dejarlo sin dueño).
- **referee** (árbitro, creado por el admin, sin equipo): puede capturar resultado y goles de **cualquier partido pendiente** (`/arbitro`); NO puede corregir un partido ya jugado — eso es exclusivo del admin. Sección propia protegida por `proxy.ts` + `requireReferee()`/`requireAdminOrReferee()`.
- **público**: ve tablas, goleo, calendario y liguilla sin login.
- Datos de jugador MÍNIMOS: nombre + dorsal (decisión legal: minimización de datos, posibles menores de edad).

## Stack y arquitectura

- Next.js 16 (App Router) + **TypeScript estricto** + Tailwind CSS 4. Deploy en Vercel.
- **Supabase (Postgres)**: service-role key SOLO en servidor (`lib/supabase.ts`, cliente lazy). Esquema versionado en `supabase/schema.sql`. RLS deny-all en todas las tablas.
- **Auth propia** (tabla `users`, bcryptjs cost 12): cookie `furbo_session` httpOnly firmada con HMAC (`lib/session.ts`, solo Web Crypto — edge-safe), payload `{uid, role, tv, exp}` — **no lleva `teamId`**: un dueño puede tener varios equipos, así que el equipo activo siempre se valida por request (ver regla 2). `token_version` en DB invalida sesiones al resetear contraseña.
- **OJO Next 16**: NO existe `middleware.ts` — el archivo es **`proxy.ts`** en la raíz (corre en edge: sin bcrypt ni Supabase ahí). `cookies()` y `params` son **async**. Ante la duda, lee `node_modules/next/dist/docs/`.

## Reglas de seguridad — OBLIGATORIAS en todo cambio

1. `proxy.ts` es solo la primera barrera (UX). **TODA Server Action / route handler revalida contra DB** con `requireAdmin()` / `requireOwnedTeam()` / `requireReferee()` de `lib/auth.ts` antes de mutar.
2. Un dueño de equipo puede tener varios equipos, así que el `teamId` de una acción SÍ puede llegar por URL/formulario — pero SIEMPRE hay que pasarlo por `requireOwnedTeam(teamId)` (valida `teams.owner_user_id === session.uid` contra DB) antes de usarlo. Nunca confiar en un `teamId` de cliente sin ese chequeo.
3. Alta de jugadores SOLO vía el RPC `create_player_atomic` (chequeo de límite atómico con FOR UPDATE).
4. Validación **zod** en toda action antes de tocar DB. Errores genéricos al cliente; detalle solo en logs del server.
5. Nada de secretos con prefijo `NEXT_PUBLIC_` (excepto `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SITE_URL`, que son genuinamente públicos). `.env.local` jamás al repo. `MP_ACCESS_TOKEN` es secreto — solo servidor, nunca `NEXT_PUBLIC_`.
6. Login con rate limit (tabla `login_attempts`) y mensaje único anti-enumeración.
7. Cero analytics/trackers/scripts de terceros sin discutirlo antes (implicaría banner de cookies).
8. Toda página nueva debe conservar el Footer con links a `/privacidad` y `/terminos`.

## Equipo y flujo de trabajo — LEE ESTO ANTES DE CUALQUIER CAMBIO

Este proyecto lo trabajan **dos personas en paralelo**, cada una desde su propia máquina con su propio Claude Code:

- **Gerardo** — GitHub: `gerardovmgof`
- **Sebastián** — con su propia cuenta de GitHub

Reglas obligatorias para Claude en cada sesión:

1. **Al empezar la sesión** (antes del primer cambio): ejecuta `git pull --rebase origin main`.
2. **Se pushea directo a `main`.** No uses ramas ni Pull Requests salvo que el usuario lo pida explícitamente.
3. **Antes de cada push**: `git pull --rebase origin main` y luego `git push origin main`. Si el rebase da conflicto, resuélvelo, verifica que `npm run build` pasa, y continúa.
4. **Commits pequeños y frecuentes.** Cada push a `main` deploya AUTOMÁTICAMENTE a producción (~1 min).
5. **Nunca pushees con el build roto.** Corre `npm run build` (y `npm run test` si tocaste `lib/standings.ts` o `lib/bracket.ts`) antes de pushear.
6. Mensajes de commit en español, cortos y descriptivos.
7. La coordinación de "quién trabaja en qué" es por WhatsApp. Si el pull trae cambios recientes en el archivo que vas a tocar, avísale al usuario antes de continuar.

## Plan de fases (estado)

- [x] F0 — Migración a TypeScript + tooling (vitest, zod, bcryptjs, supabase-js)
- [x] F1 — Datos + auth: schema.sql, lib (supabase/session/auth/ratelimit), proxy.ts, /login, /privacidad, /terminos, Footer, seed-admin
- [x] F2 — Admin: torneos y equipos · Usuarios de equipo + /equipo/plantilla (CRUD con límite)
- [x] F3 — Calendario admin + captura de resultados/goles + /calendario público
- [x] F4 — Tablas públicas: /tabla (standings con desempates), /goleo, /equipos/[id], /equipos, home real, Tabs de navegación pública
- [x] F5 — Liguilla: generación de bracket, captura playoff con penales y propagación, /liguilla
- [x] F6 — Endurecimiento: headers de seguridad (CSP, HSTS, etc.), guards server-only, checklist, pulido móvil, E2E completo

## Núcleo de la app: completo (F0–F6)

Torneos, equipos, delegados, calendario, resultados, tablas públicas y liguilla — todo en producción.

## Fase nueva en curso (F7–F11)

- [x] F7 — Sorteo automático del calendario: `lib/schedule.ts` (round-robin con barajado aleatorio, soporta impares con descanso e ida/vuelta), botón "Sortear calendario" en `/admin/calendario` (solo si el torneo no tiene partidos regulares aún).
- [x] F8 — Rol árbitro: tercer rol `referee` (sin equipo). `/arbitro` lista partidos pendientes de cualquier fase; captura resultado y goles vía el mismo componente que usa el admin (`components/ScoreCaptureForm.tsx` + `lib/actions/captureResult.ts`, ambos compartidos). El árbitro NO puede corregir un partido ya jugado — esa acción exige `requireAdmin()` implícito vía el guard `actor.role === 'referee' && match.status === 'played'`. Alta de árbitros y de "dueños de equipo" desde `/admin/usuarios` (toggle en `CreateUserForm`).
- [x] F9 — Link de transmisión en vivo por partido: columna `matches.stream_url`, acepta cualquier URL http/https (Facebook, YouTube, Instagram, TikTok, Twitch, lo que sea — sin restricción de dominio, ver `lib/validation.ts#parseStreamUrl`). Editable desde `EditMatchForm` y desde la captura (`ScoreCaptureForm`); visible en `/calendario` público, en "Próximos partidos" del home, y también en la fila del admin de calendario.
- [x] F10 — Pagos con Mercado Pago (sandbox): tabla `charges` (kind `slots`|`rent`, status `pending`|`paid`|`canceled`, `mp_payment_id` unique = idempotencia) + `tournaments.slot_price_cents`. `lib/mercadopago.ts` (Checkout Pro, lazy). `app/api/mp/webhook/route.ts` verifica el pago contra la API de MP (nunca confía en el payload entrante) y solo entonces marca `paid` + incrementa `player_limit` (RPC `increment_team_player_limit`). Admin: `/admin/cobros` (fija precio de cupo, crea cargos manuales de renta, marca pagado a mano o cancela). Dueño de equipo: `/equipo/[teamId]/pagos` (compra cupos, paga cargos pendientes). **Deroga la regla histórica "sin pagos en la app"** — Gerardo aprobó explícitamente esta excepción; la app nunca guarda datos de tarjeta. **Pendiente**: mientras la organizadora no tenga cuenta de Mercado Pago, `MP_ACCESS_TOKEN` debe ser un access token de PRUEBA (sandbox) — cambiar a producción es el único paso que falta cuando ella tenga su cuenta. **⚠️ Bypass temporal activo**: `MP_ACCESS_TOKEN` todavía no está configurado en Vercel (Gerardo bloqueado por 2FA), así que `lib/paymentsTestMode.ts#SKIP_MERCADOPAGO_FOR_TESTING = true` hace que "Pagar" marque el cargo como pagado de inmediato sin pasar por Mercado Pago (ver `lib/charges.ts#markChargePaid`, reusado también por el webhook y "marcar pagado manualmente"). Apágalo (`= false`) en cuanto `MP_ACCESS_TOKEN` esté configurado en producción.
- [x] F11 — Autorregistro de equipos + multi-equipo por dueño: `teams.owner_user_id` (uno-a-muchos, reemplaza `users.team_id` que ya no existe). El admin crea el usuario "dueño de equipo" sin equipo (`/admin/usuarios`, ya sin selector de equipo); el dueño se autorregistra su(s) equipo(s) desde el dashboard `/equipo` (`RegisterTeamForm`, solo torneos en `draft` con precio de cupo configurado — `listOpenTournamentsForRegistration`), arrancando en `player_limit = 0` y comprando cupos después vía el flujo de F10 ya existente. Rutas de equipo ahora viven bajo `/equipo/[teamId]/...`, protegidas por `requireOwnedTeam(teamId)` (`lib/auth.ts`) en vez del viejo `requireTeamUser()`. El admin puede seguir creando equipos directo en "Equipos" y ligarlos a un dueño existente (selector opcional en `CreateTeamForm`/`EditTeamForm`). Si un torneo ya inició y se agrega un equipo nuevo, `/admin/calendario` muestra "Agregar equipos nuevos al calendario" (`extendScheduleAction`) — solo agrega las jornadas del equipo nuevo, sin tocar partidos/resultados existentes. De paso se arregló un bug real: en `/admin/usuarios` el toggle "Dueño de equipo"/"Árbitro" cambiaba de panel pero no resaltaba el botón activo — el `<label>` estaba anidado en un `<div>` que rompía el selector `peer-checked` (solo aplica entre hermanos directos); se aplanó la estructura en `CreateUserForm.tsx`.

Marca la casilla correspondiente en este archivo al completar una fase (en el mismo commit).

## Comandos

- `npm run dev` — servidor local en http://localhost:3000
- `npm run build` — build de producción (obligatorio antes de push)
- `npm run test` — tests de lógica pura (standings, bracket)
- `npm run seed:admin` — siembra el primer usuario admin (ver scripts/seed-admin.mjs)

## Notas

- `CLAUDE.local.md` (si existe) es contexto específico de cada máquina; está gitignoreado, no lo subas.
- Pagos: Gerardo aprobó explícitamente el flujo de Mercado Pago descrito en F10 (ver arriba). Cualquier otro requerimiento de pagos/datos bancarios que se salga de ese alcance (guardar tarjetas directamente, otra pasarela, etc.), frénalo y coméntalo con Gerardo primero.
