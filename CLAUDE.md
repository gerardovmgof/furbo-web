@AGENTS.md

# Furbo Web

Plataforma web para gestión de ligas de fútbol amateur. Cliente real: una organizadora de liga en Querétaro.

## Qué pidió la clienta

- **Tabla de goleo, tabla de posiciones y calendario** de la liga, visibles para todos.
- En la tabla de posiciones: desglose de puntos (juegos jugados, ganados, empatados, perdidos, goles a favor/en contra, diferencia, puntos). Referencia visual: las tablas de la app "Benjamín".
- **Registro de jugadores por los propios equipos**, controlado por códigos: la organizadora vende N registros a un equipo y le da un código que permite dar de alta exactamente N jugadores. Ese es su mecanismo de control/cobro (el cobro es FUERA de la app, en efectivo/transferencia — la app NO maneja pagos ni datos bancarios).
- **Dos tipos de acceso**: administrador (la organizadora: captura resultados, goles, minutos, estadísticas, genera códigos) e invitado/equipo (ve sus puntos, goles, calendario, y registra a sus jugadores con su código).
- Con dominio propio; "app" para la clienta = web app usable desde el celular.

## Stack

Next.js (App Router) + JavaScript + Tailwind CSS 4. Deploy en Vercel. Base de datos y auth: aún no elegidos (se decidirá al empezar la app real).

## Equipo y flujo de trabajo — LEE ESTO ANTES DE CUALQUIER CAMBIO

Este proyecto lo trabajan **dos personas en paralelo**, cada una desde su propia máquina con su propio Claude Code:

- **Gerardo** — GitHub: `gerardovmgof`
- **Sebastián** — con su propia cuenta de GitHub

Reglas obligatorias para Claude en cada sesión:

1. **Al empezar la sesión** (antes del primer cambio): ejecuta `git pull --rebase origin main`. La otra persona pudo haber pusheado desde tu última sesión.
2. **Se pushea directo a `main`.** No uses ramas ni Pull Requests salvo que el usuario lo pida explícitamente (p. ej. para un cambio grande que quiera ver en preview antes de producción).
3. **Antes de cada push**: `git pull --rebase origin main` otra vez, y luego `git push origin main`. Si el rebase da conflicto, resuélvelo tú (Claude) en el momento, verifica que `npm run build` pasa, y continúa.
4. **Commits pequeños y frecuentes.** Pushea en cuanto algo funcione; no acumules trabajo local de varios días. Cada push a `main` deploya AUTOMÁTICAMENTE a producción en Vercel (~1 min).
5. **Nunca pushees algo que rompe el build.** Si el cambio es riesgoso, corre `npm run build` antes de pushear.
6. Mensajes de commit en español, cortos y descriptivos (p. ej. `Agrega tabla de goleo`).
7. La coordinación de "quién trabaja en qué" la hacen Gerardo y Sebastián por WhatsApp. Si el usuario te pide tocar algo y sospechas que la otra persona está trabajando en el mismo archivo (p. ej. el pull trajo cambios recientes ahí), avísale al usuario antes de continuar.

## Comandos

- `npm run dev` — servidor local en http://localhost:3000
- `npm run build` — build de producción (correr antes de push si el cambio es riesgoso)
- `npm run lint` — linter

## Notas

- `CLAUDE.local.md` (si existe) contiene contexto específico de la máquina de cada quien; está gitignoreado, no lo subas al repo.
- La app NO maneja pagos, tarjetas ni datos bancarios. Si un requerimiento futuro apunta a eso, frénalo y coméntalo con Gerardo.
