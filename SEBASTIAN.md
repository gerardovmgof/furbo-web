# Hola Sebastián 👋 — Guía de arranque

Este repo es **Furbo Web**, la app de la liga de fútbol. Lo vamos a trabajar Gerardo y tú en paralelo, cada quien desde su compu, usando Claude Code como "programador". Tú le dices a Claude qué hacer en español, y él escribe el código, lo sube a GitHub, y Vercel publica la página automáticamente.

## Configuración inicial (una sola vez, ~20 min)

### 1. Crea tu cuenta de GitHub
1. Entra a https://github.com/signup
2. Crea tu cuenta (gratis) con tu correo.
3. Pásale tu nombre de usuario a Gerardo por WhatsApp.

### 2. Acepta la invitación al repo
Gerardo te va a invitar como colaborador. Te llegará un correo de GitHub ("You've been invited to collaborate") — ábrelo y dale **Accept invitation**. También aparece en https://github.com/notifications

### 3. Instala Claude Code
1. Necesitas una suscripción de Claude (Pro). Si no la tienes, coméntalo con Gerardo.
2. Instala la app de Claude para Mac/Windows desde https://claude.com/download (Claude Code viene incluido), o en terminal: `npm install -g @anthropic-ai/claude-code`
3. Ábrelo e inicia sesión con tu cuenta de Claude.

### 4. Instala Node.js (si no lo tienes)
Descárgalo de https://nodejs.org (versión LTS, botón grande). Siguiente, siguiente, listo.

### 5. Clona el repo (bájatelo a tu compu)
Abre la Terminal y pega esto (una línea a la vez):

```
cd ~/Documents
git clone https://github.com/gerardovmgof/furbo-web.git
cd furbo-web
npm install
```

Cuando el `git clone` te pida usuario y contraseña: el usuario es el tuyo de GitHub, y la "contraseña" NO es tu contraseña normal — es un **token**. Genéralo en https://github.com/settings/tokens → "Generate new token (classic)" → márcale el permiso `repo` → cópialo y pégalo como contraseña. (Guárdalo; solo se muestra una vez.)

> Si esto se te complica, dile a tu Claude: *"ayúdame a clonar el repo furbo-web de GitHub y configurar mis credenciales"* — él te lleva de la mano.

### 6. Preséntale el proyecto a tu Claude
Abre Claude Code **dentro de la carpeta** `furbo-web`. Claude lee solo el archivo `CLAUDE.md` del repo, que ya le explica todo: qué es el proyecto, las reglas de trabajo y cómo subir cambios. No tienes que explicarle nada.

## Tu flujo de un día normal

1. **Avisa por WhatsApp** en qué vas a trabajar (para no chocar con Gerardo en el mismo archivo).
2. Abre Claude Code en la carpeta del proyecto.
3. Pídele lo que quieras en español: *"agrega X a la tabla de posiciones"*, *"cambia el color del encabezado"*, etc.
4. Para verlo en tu compu antes de subirlo: pídele *"corre el servidor local"* y abre http://localhost:3000
5. Cuando estés conforme: dile *"sube los cambios"*. Claude hace pull, commit y push a `main`.
6. Espera ~1 minuto y abre la URL de producción — tu cambio ya está en línea. Así de fácil.

## Reglas de convivencia (las mismas que sigue Claude solito)

- **Siempre** deja que Claude haga `git pull` antes de empezar y antes de subir — él ya lo sabe, no lo interrumpas si lo hace.
- Cambios chicos y frecuentes; no acumules una semana de trabajo sin subir.
- Todo push a `main` se publica en producción automáticamente. Si tu cambio es grande o arriesgado, dile a Claude: *"hazlo en una rama para verlo en preview primero"*.
- ¿Algo se rompió en producción? Avisa por WhatsApp; entre los dos Claudes se arregla rápido.

## ¿Dudas?

Pregúntale primero a tu Claude — sabe todo lo de este archivo y más. Si aún así te atoras, WhatsApp a Gerardo.
