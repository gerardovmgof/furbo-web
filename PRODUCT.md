# Product

## Register

product

## Users

- **Organizadora (admin)** — no técnica, usa la app en computadora o celular. Usuaria recurrente: da de alta torneos y equipos, crea usuarios, arma el calendario, captura resultados, gestiona cobros. Tolera algo de curva de aprendizaje porque vuelve seguido.
- **Dueños de equipo** — casuales, sobre todo en celular. Entran poco tiempo (registrar jugadores, pagar cupos) y muchas veces es su primera vez en la app sin nadie que les explique — el caso real que expuso Enoc: le da clic a todo para descubrir qué hace cada botón.
- **Árbitros** — en la cancha, celular, con prisa. Solo capturan resultado y goles el día del partido, parados en la cancha, a veces bajo sol directo.
- **Público en general** — padres, jugadores, curiosos que solo consultan tablas, goleo, calendario y liguilla. Nunca inician sesión.

## Product Purpose

Furbo Web administra ligas de fútbol amateur de punta a punta: torneos, equipos y calendario; control de registros pagados por equipo; captura de resultados y goles; generación de liguilla/playoffs; cobros reales vía Mercado Pago (compra de cupos, renta de cancha); y tablas públicas (posiciones, goleo, calendario, liguilla) sin necesidad de cuenta.

Éxito se ve como: la organizadora administra todo el torneo sin fricción; un dueño de equipo entiende solo, sin ayuda externa, qué hacer la primera vez que entra; un árbitro captura un resultado en cancha en segundos, con el celular en la mano.

## Brand Personality

Profesional, serio, deportivo. Se siente como una plataforma real de gestión de liga — no como una plantilla genérica de admin dashboard, ni como una app amateur de hobby. Maneja dinero real (Mercado Pago), así que la seriedad importa, pero sin caer en frialdad corporativa: tiene identidad propia de fútbol.

## Anti-references

- Plantillas genéricas de admin dashboard (el look de "Tailwind UI stock" / admin template gratis).
- Estética infantil o casual de app de hobby — esto es una operación real con cobros reales.

## Design Principles

1. **Autoexplicativo en el primer uso.** Un dueño de equipo o árbitro que entra por primera vez debe entender qué hace cada sección sin tener que darle clic a todo para descubrirlo — feedback directo y repetido en la primera prueba de usuario real (Enoc).
2. **Cancha antes que escritorio.** Dueños de equipo y árbitros usan la app casi siempre desde el celular, muchas veces parados en la cancha. Se diseña mobile-first, no se adapta después.
3. **Seriedad sin frialdad.** Se maneja dinero real; la app debe sentirse confiable y profesional sin caer en la estética fría de un dashboard corporativo genérico.
4. **Un solo acento, sin ruido visual.** Paleta restringida (neutros zinc + un acento emerald) ya establecida en el código — no agregar elementos decorativos que no aporten jerarquía o función.
5. **Nunca depender de JavaScript para lo esencial.** Patrón ya establecido: los flujos críticos (formularios, redirecciones de pago externas) deben funcionar aunque el JS falle o tarde en hidratar — lección aprendida de bugs reales en producción.

## Accessibility & Inclusion

- Contraste AA como mínimo (fondo zinc-950/blanco + texto zinc-100/zinc-900 según modo).
- **Implementado (F12):** modo claro/oscuro con switch manual (botón en el Footer, visible en toda la app). Persiste en `localStorage`, no depende de `prefers-color-scheme` — un árbitro en la cancha bajo sol directo necesita elegir según la luz del momento, no según el SO del teléfono.
