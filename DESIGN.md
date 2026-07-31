---
name: Furbo Web
description: Plataforma de gestión de ligas de fútbol amateur — torneos, calendario, cobros y tablas públicas
colors:
  night-pitch: "#09090b"
  night-surface: "#18181b"
  night-surface-raised: "#27272a"
  night-border: "#27272a"
  night-border-input: "#3f3f46"
  night-ink-primary: "#f4f4f5"
  night-ink-secondary: "#d4d4d8"
  night-ink-muted: "#a1a1aa"
  night-ink-faint: "#71717a"
  day-pitch: "#ffffff"
  day-surface: "#fafafa"
  day-surface-raised: "#f4f4f5"
  day-border: "#e4e4e7"
  day-border-input: "#d4d4d8"
  day-ink-primary: "#18181b"
  day-ink-secondary: "#3f3f46"
  day-ink-muted: "#52525b"
  day-ink-faint: "#71717a"
  floodlight-emerald: "#059669"
  floodlight-emerald-hover: "#10b981"
  floodlight-emerald-link-dark: "#34d399"
  floodlight-emerald-link-light: "#047857"
  card-red: "#f87171"
  card-red-link-light: "#dc2626"
  card-red-border-dark: "#7f1d1d"
  card-red-border-light: "#fca5a5"
  card-red-surface-dark: "#450a0a"
  card-red-surface-light: "#fef2f2"
  flag-amber: "#fcd34d"
  flag-amber-link-light: "#b45309"
  flag-amber-border-dark: "#78350f"
  flag-amber-surface-dark: "#451a03"
typography:
  title:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  body:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Sans, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  data:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.floodlight-emerald}"
    textColor: "{colors.night-pitch}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.floodlight-emerald-hover}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.night-ink-secondary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-destructive:
    backgroundColor: "transparent"
    textColor: "{colors.card-red}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.night-surface}"
    rounded: "{rounded.lg}"
    padding: "16px"
  input:
    backgroundColor: "{colors.night-pitch}"
    textColor: "{colors.night-ink-primary}"
    rounded: "{rounded.md}"
    padding: "8px 12px"
---

# Design System: Furbo Web

## 1. Overview

**Creative North Star: "La Cancha de Noche" (The Night Pitch)**

Furbo Web es una herramienta de operación real, no una vitrina: la organizadora administra torneos con dinero de por medio, el árbitro captura resultados parado en la cancha, el dueño de equipo entra una vez cada tanto y necesita entender todo sin ayuda. El sistema actual (modo oscuro, hoy la única variante implementada) parte de una imagen concreta: la cancha bajo reflectores por la noche — un fondo casi negro (`#09090b`) que es el pasto en penumbra, cortado por un único acento verde esmeralda que es la luz de los reflectores marcando lo que importa: el botón que hay que apretar, el cargo que está pendiente, el resultado que ya se jugó. Todo lo demás — tarjetas, bordes, texto — son gradaciones del mismo gris frío (zinc), nunca un segundo color compitiendo por atención.

Esto rechaza explícitamente la plantilla genérica de "admin dashboard" (paleta de grises sin personalidad, azul corporativo de SaaS) y la estética infantil de app de hobby: el emerald es deliberado y escaso, no decorativo. Es plano por diseño — casi ninguna sombra en toda la app — porque la jerarquía la da el color de fondo (tres escalones: `night-pitch` → `night-surface` → `night-surface-raised`) y el borde, no la simulación de profundidad.

Un segundo tiempo del mismo partido, "El Partido de Día" (Day Match), es el modo claro: la misma cancha, ahora de día. Nace de una necesidad real, no estética — los árbitros capturan resultados en la cancha bajo sol directo, donde el modo oscuro es ilegible. Usa la MISMA familia neutra (zinc) invertida, no un beige/crema "cálido" — sigue siendo la cancha, solo que de día, no una paleta nueva.

**Key Characteristics:**
- Un solo acento (emerald) en escasez deliberada — nunca decorativo, siempre funcional (acción primaria, estado activo, éxito).
- Plano por diseño: la jerarquía viene de tres escalones de fondo y un borde de 1px, no de sombras.
- Misma familia neutra (zinc) en los dos modos, invertida — no dos paletas distintas.
- Tipografía única (Geist Sans) con Geist Mono reservado exclusivamente para datos tabulares (marcadores, dorsales, montos).

## 2. Colors

Paleta restringida: neutros zinc en dos direcciones (noche/día) + un único acento funcional, más dos colores de estado (rojo, ámbar) usados solo para alertas y acciones destructivas.

### Primary
- **Floodlight Emerald** (`#059669` / hover `#10b981`): el único acento del sistema. Botón de acción primaria, borde de foco en inputs, estado activo en pestañas de navegación, resaltado de zona de clasificación en tablas. En modo noche los links usan un emerald más claro (`#34d399`) para contraste sobre fondo oscuro; en modo día, uno más oscuro (`#047857`) para contraste sobre blanco.

### Neutral
- **Night Pitch** (`#09090b`): fondo base en modo oscuro — la cancha en penumbra.
- **Night Surface** (`#18181b`): tarjetas y contenedores sobre el fondo noche.
- **Night Surface Raised** (`#27272a`): estado hover/nested sobre una tarjeta.
- **Night Border** (`#27272a`) / **Night Border Input** (`#3f3f46`): borde de tarjeta (sutil) y borde de campo de formulario (un paso más visible, para que el input se note interactivo).
- **Night Ink Primary** (`#f4f4f5`) → **Secondary** (`#d4d4d8`) → **Muted** (`#a1a1aa`) → **Faint** (`#71717a`): jerarquía de texto de cuatro pasos — título/valor, cuerpo, etiqueta/ayuda, texto casi invisible (placeholder, timestamp).
- **Day Pitch** (`#ffffff`), **Day Surface** (`#fafafa`), **Day Surface Raised** (`#f4f4f5`), **Day Border** (`#e4e4e7`) / **Day Border Input** (`#d4d4d8`), **Day Ink Primary** (`#18181b`) → **Secondary** (`#3f3f46`) → **Muted** (`#52525b`) → **Faint** (`#71717a`): el mismo sistema de cuatro pasos, invertido tono por tono sobre la MISMA familia zinc — nunca un crema o beige "cálido".

### Named Rules

**The One Light Rule.** El emerald es el único color que puede indicar "esto es interactivo" o "esto es lo importante en esta pantalla". Si necesitas un segundo color para llamar la atención, la jerarquía tipográfica o el orden están mal, no falta color.

**The Same Pitch Rule.** Modo noche y modo día no son dos paletas — son la misma familia zinc invertida. Ningún tono cálido (crema, beige, sepia) entra al sistema neutro bajo ningún modo.

### Estados (uso restringido a alertas/confirmaciones, nunca decorativo)
- **Card Red** — texto `#f87171` (noche) / `#dc2626` (día), borde `#7f1d1d` (noche) / `#fca5a5` (día), fondo de aviso `#450a0a` (noche) / `#fef2f2` (día). Solo para: acción destructiva ("Eliminar", "Dar de baja"), error de formulario, cargo rechazado.
- **Flag Amber** — texto `#fcd34d` (noche) / `#b45309` (día), borde `#78350f` (noche), fondo de aviso `#451a03` (noche). Solo para: advertencia no destructiva (pago pendiente de confirmación, modo de prueba activo).

## 3. Typography

**Display/Body Font:** Geist Sans (con system-ui, sans-serif de respaldo)
**Data Font:** Geist Mono — reservado EXCLUSIVAMENTE para datos tabulares: marcador de partido, dorsal de jugador, montos.

**Character:** Una sola familia sans para todo el texto de interfaz (títulos, cuerpo, etiquetas) — sin mezclar familias por jerarquía, la jerarquía la da peso y tamaño, no la fuente. Geist Mono aparece únicamente cuando el dato necesita alinearse en columna o leerse como cifra exacta (nunca como estilo).

### Hierarchy
- **Title** (700, 1.5rem/24px, line-height 1.25): título de página (`<h1>`/`<h2>` de cada sección — "Torneos", "Pagos — Duendes").
- **Body** (400, 1rem/16px, line-height 1.5): texto de contenido, nombres de equipo/jugador, párrafos de ayuda.
- **Label** (500, 0.875rem/14px, line-height 1.4): etiquetas de formulario, texto secundario de tarjeta (subtítulos como "4 registros pagados").
- **Data** (400, 0.875rem/14px, monoespaciada): marcador ("1-0"), dorsal ("#7"), montos en tablas.

### Named Rules
**The No Display Rule.** No hay un tamaño "hero" en todo el sistema — el título más grande es 1.5rem. Esto es una herramienta de trabajo, no una landing page; ninguna pantalla necesita gritar.

## 4. Elevation

Plano por diseño. No hay vocabulario de sombras: la profundidad se transmite por tres escalones de fondo (`pitch` → `surface` → `surface-raised`) y un borde de 1px, nunca por `box-shadow`. La única excepción documentada en todo el código es la tarjeta de login (`shadow-xl`), que flota sola sobre un fondo vacío sin otras tarjetas alrededor que le den contexto — ahí sí necesita una sombra para separarse del fondo.

### Named Rules
**The Flat-by-Default Rule.** Ninguna tarjeta, botón o modal lleva sombra a menos que esté completamente sola en la pantalla sin otro elemento de referencia (como el login). Si hay más de una tarjeta visible, la jerarquía la dan el fondo y el borde, no la sombra.

## 5. Components

### Buttons
- **Shape:** esquinas suavemente redondeadas (`rounded-lg`, 8px) en todos los botones e inputs; contenedores de tarjeta un paso más redondeados (`rounded-xl`, 12px).
- **Primary:** fondo Floodlight Emerald, texto sobre fondo oscuro/blanco según contraste, padding `8px 16px`, semibold. Una sola acción primaria visible por vista — nunca dos botones emerald compitiendo en la misma pantalla.
- **Secondary/Ghost:** transparente con borde neutro (`night-border-input` / `day-border-input`), texto `ink-secondary`. Usado para acciones de navegación o "cerrar/cancelar".
- **Destructive:** transparente con borde `card-red-border`, texto `card-red`. Reservado a "Eliminar", "Dar de baja", "Cancelar cargo".
- **Hover/Focus:** el primario oscurece/aclara un paso (`floodlight-emerald` → `floodlight-emerald-hover`); el foco de teclado usa el mismo emerald como contorno del input, nunca un azul de navegador por defecto.

### Cards / Containers
- **Corner Style:** `rounded-xl` (12px).
- **Background:** `night-surface` / `day-surface`, un paso por encima del fondo de página.
- **Shadow Strategy:** ninguna (ver Elevation) — el contraste tarjeta/fondo es lo que separa.
- **Border:** 1px `night-border` / `day-border`, sutil, casi invisible a propósito — delimita sin gritar.
- **Internal Padding:** 16px (`spacing.md`); las secciones dentro de una página usan 32px (`spacing.xl`) entre bloques (`space-y-8`).

### Inputs / Fields
- **Style:** fondo igual al fondo de página (no al de la tarjeta que lo contiene, para que se note como "hueco" a llenar), borde `border-input` (un paso más visible que el borde de tarjeta), `rounded-lg`.
- **Focus:** el borde cambia a Floodlight Emerald — es el único momento en que el emerald aparece en un borde de campo.
- **Error:** el mensaje de error aparece como texto `card-red` debajo del campo, no como borde rojo del input — el sistema no duplica la señal.

### Navigation
- Fila horizontal de pestañas de texto plano; la pestaña activa es la única con fondo sólido Floodlight Emerald y texto claro — todas las demás son texto `ink-muted` sin fondo. En celular la fila hace scroll horizontal en vez de apilarse o truncarse.

### Tarjetas de datos con acento lateral (patrón recurrente)
Marcador de partido, fila de tabla de posiciones, fila de cargo pendiente: todas siguen el mismo patrón de "tarjeta neutra + un solo dato en emerald o rojo" — nunca franjas de color lateral (`border-left` grueso) como acento; el color vive en el texto del dato, no en el borde de la tarjeta.

## 6. Do's and Don'ts

### Do:
- **Do** usar Floodlight Emerald (`#059669`) para una sola acción primaria por pantalla, nunca dos.
- **Do** mantener la jerarquía de texto en cuatro pasos de zinc (primary/secondary/muted/faint) — no inventar un quinto tono.
- **Do** usar Geist Mono solo para datos tabulares exactos (marcador, dorsal, monto) — nunca como estilo general.
- **Do** construir el modo claro invirtiendo la MISMA familia zinc, tono por tono — nunca introducir un neutro cálido nuevo.
- **Do** dejar el sistema plano: fondo + borde de 1px es suficiente jerarquía; reservar sombra para elementos completamente aislados (como login).

### Don't:
- **Don't** usar plantillas genéricas de admin dashboard (grises sin personalidad, azul corporativo de SaaS) — es el anti-referente explícito del proyecto.
- **Don't** caer en estética infantil o casual de app de hobby — esta herramienta maneja dinero real.
- **Don't** usar `border-left` grueso como acento de color en tarjetas o filas de tabla — el color vive en el texto/dato, nunca en una franja lateral.
- **Don't** usar un beige/crema/sand como fondo del modo claro "para que se vea cálido" — es la misma cancha, solo que de día; sigue siendo zinc invertido.
- **Don't** agregar una segunda familia tipográfica para "jerarquía visual" — Geist Sans hace todo el trabajo de interfaz; Geist Mono es solo para datos.
- **Don't** agregar sombras decorativas a tarjetas que ya tienen otras tarjetas alrededor — rompe el sistema plano sin necesidad.
