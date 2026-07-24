# Handoff: Identidad «Marcador» — PadelClub OS

## Overview
Rediseño integral de la identidad visual de PadelClub OS (SaaS multi-tenant de gestión de clubes de pádel) en sus tres contextos: plataforma/superadmin, administración de club y portal del jugador. Incluye marca nueva, sistema de tokens, componentes y 15+ pantallas hi-fi. El objetivo de este paquete es que Claude Code lo implemente **en el repo real `albope/padel-club-os`** (Next.js 14 + Tailwind + Radix/shadcn) de forma incremental, sin tocar lógica de negocio, APIs ni auth.

## About the Design Files
Los `.dc.html` de este paquete son **referencias de diseño en HTML** (prototipos con el look y comportamiento previstos), NO código de producción. La tarea es **recrearlos dentro del codebase existente** usando sus patrones: componentes shadcn/cva en `src/components/ui`, variables HSL en `globals.css`, Tailwind, Lucide, Recharts y FullCalendar. No copiar el HTML tal cual.

## Fidelity
**High-fidelity.** Colores, tipografía, espaciados, radios y estados son finales — recrear con precisión de píxel usando las librerías del repo. `tokens.padelclubos.json` es la fuente de verdad de valores.

## Contexto del repo (leído durante el diseño)
- Tokens actuales: `src/app/globals.css` (plantilla shadcn, primario `hsl(217 91% 50%)`) y `tailwind.config.ts` (colores semánticos + `--sidebar-*`). **Se conservan los NOMBRES de variables**; solo cambian valores + se añaden nuevas.
- Shell admin: `src/app/dashboard/layout.tsx`, `src/components/layout/{Sidebar,Header,MobileNavBar}.tsx`, `src/lib/nav-items.ts`.
- Portal jugador: `src/components/club/{ClubLayout,ClubHome,GridReservas,ConfirmacionReserva}.tsx` — hoy aplican `primaryColor` como hex crudo (a reemplazar por el motor de tenant).
- Dashboard: `src/components/dashboard/{DashboardClient,AgendaDelDia,IngresosSemana}.tsx`.

## Design Tokens (fuente: tokens.padelclubos.json)
Color claro: background `#F6F3ED` (papel), surface `#FDFCFA/#FFF`, foreground `#1C1A17` (tinta), border `#E7E2D8`/`#DDD7CC`, muted-fg `#8A8377`, secundario texto `#5C564C`.
Marca/acción: verde pista `#157A54` (hover `#0E5C3F`), verde 300 `#6FBF9C`, verde dark-mode `#2FA075` (con texto `#0B241A`).
Oscuro (3 capas): bg `#14120F`, surface `#1E1B17`, raised `#282420`, border `#37322A`, text `#F1EDE4`.
Semánticos (fg/bg/border): info `#2E63C0/#E8EFFA/#C6D8F2`; éxito `#3D8B37/#E9F4E6/#C8E4C3`; aviso `#C7871E/#FBF1DD/#EFD9AC`; error `#B3402E/#F9E8E4/#EFC9C0`. **El azul deja de ser marca: solo estado informativo.**
DataViz: `#157A54 #2E63C0 #C7871E #7B4B94 #4A9DA8 #8A8377`; «pendiente» siempre con trama además de color.
Espaciado: base 4px (ritmo 8/16/24/40). Radios: 6px controles, 10px módulos, 14px superficies móviles. Breakpoints 360/768/1024/1440; contenido admin máx. 1320px.
Tipografía: **Archivo** (variable, `font-stretch:112%`, 650–800) para display/KPIs y **Instrument Sans** (400–700) para UI — autohospedadas (SIL OFL), reemplazan Inter/Sora mapeando `--font-inter`/`--font-sora`. `font-variant-numeric: tabular-nums` OBLIGATORIO en KPIs, precios, horas, tablas y calendarios. Escala: 36/28(display), 28(kpi), 18(title), 14(body), 12(caption), 11 uppercase +0.08em (label).
Iconos: Lucide stroke 1.75; 16 inline, 20 nav/botones, 24 empty states.
Motion: press 120ms ease-out; overlays 220ms cubic-bezier(0.32,0.72,0,1); cambio de vista 180ms fade+4px; celebración única (confirmar reserva/pago) 400ms; `prefers-reduced-motion` → fades 80ms. Prohibido: animación continua, shimmer, orbes, glassmorphism.

## Motor de tenant (nuevo — `src/lib/tenant-theme.ts`)
Reemplaza el uso directo de `club.primaryColor`:
1. Generar escala 50–900 en OKLCH desde el hex (croma máx 0.17, L ajustada a gama accesible).
2. Calcular `on-primary` (blanco o tinta según contraste ≥4.5:1), hover (L−6), pressed (L−12), tint-50.
3. Exponer como CSS vars `--tenant-*` en el layout del club; modo oscuro usa el tono 400 con texto tinta.
4. Superficies permitidas: CTA primaria del jugador, nav activa, acentos de identidad. Prohibidas: semánticos, párrafos, celdas del grid, gráficos, todo el admin.
5. Ajustes del club: preview en vivo claro/oscuro + advertencia automática de contraste (ver pantalla 3d).
«Powered by PadelClub OS»: pie del portal y auth, monocromo al 60%.

## Screens / Views (referencias en los .dc.html)
- `Estado Actual — Recreación.dc.html` — ANTES (1a admin, 1b home club, 1c grid), solo referencia comparativa.
- `Hi-Fi Jugador.dc.html` — 2a home (hero tinta con próxima reserva, CTA tenant 52px, partidas con plazas tipo slot), 2b reservar (chips de día, celdas 44px: libre=borde punteado+precio, ocupada=trama diagonal, tuya=tinta, abierta=borde verde+plazas, bloqueo=icono ban; barra resumen sticky), 2c pago (desglose, métodos, política), 2d éxito/fallo recuperable (retención 10 min), 2e partidas (card expandida con 4 plazas, empty state), 2f ranking (posición personal destacada, movimiento con flecha+número), 2g perfil, 2h login con error inline, 2i offline/waitlist/cancelación (reagendar gratis vs cargo 50%).
- `Hi-Fi Admin y Plataforma.dc.html` — 3a dashboard (sidebar tinta agrupada 264px: Operación/Comunidad/Contenido/Negocio/Sistema; header 56px con ⌘K; KPIs con tendencia; **banda de ocupación por franja** = gesto firma; ingresos con trama en pendiente; pendientes con botón Cobrar), 3b reservas día por pista (celdas 36px, bloques con borde izquierdo 3px por estado + icono, drawer creación 392px, rail 72px para 1024), 3c socios (tabla 40px/fila, bulk bar tinta, badges estado con icono), 3d ajustes identidad (swatches, checks de contraste, preview claro/oscuro), 3e plataforma (banda tinta superior, tabla de clubes con plan/suscripción/MRR, «Entrar como», confirmación destructiva escribiendo el nombre), 3f dashboard oscuro.
- `Brand Kit y Design System.dc.html` — especímenes de botones/inputs/badges/slots/KPI con todos los estados (hover, foco `outline 2px offset 2px` verde, disabled 45%, loading).
- `Diagnóstico y Territorios.dc.html` y `Handoff y Cierre.dc.html` — justificación, mapeo componente a componente y fases.

## Interacciones clave
- Reservar (jugador): tocar celda libre → selección expandida a duración (90') → barra resumen → pago → éxito con celebración única / fallo con retención 10 min y reintento.
- Grid admin: click celda vacía → drawer con pista/hora prefijadas, búsqueda de socio, duración segmentada, toggle recurrente, «Crear y cobrar» (primaria) / «Crear con pago pendiente» (secundaria).
- Waitlist: campana en celda ocupada → chip aviso; estados en 2i.
- Destructivas: siempre confirmación con nombre del objeto (3e).

## Accesibilidad (no negociable)
AA 2.2: ratios publicados en el design system; estado nunca solo por color (icono+texto+trama); touch ≥44px en jugador; foco visible en todo; zoom 200%; `aria-current`, skip links y labels ya existentes se conservan.

## Plan de implementación (5 fases, detrás de flag por club)
1. **Foundations (S)**: `globals.css` + fuentes + lint anti clases de color crudas. Gate: regresión visual 4 breakpoints × 2 temas.
2. **Shell (M)**: Sidebar agrupada (añadir `group` a `NavItem`), Header, bottom-nav, ClubLayout.
3. **Componentes core (M)**: button/badge/inputs/tabla/KPI/toast sobre los cva existentes.
4. **Flujos críticos (L)**: GridReservas (jugador y admin), pago, `tenant-theme.ts` + preview en Ajustes. Gate: suite 12 tenants extremos + test daltonismo.
5. **Resto (M)**: competiciones, rankings, socios, analíticas, plataforma, marketing/emails. Retirar: clases `auth-*`, `landing-*`, orbes, gradientes, glassmorphism, ui-avatars con `#6366f1`.

## Assets
`assets/`: isotipo-color/mono/negativo.svg, favicon.svg, icon-maskable.svg (512, zona segura 80%), logo-horizontal(.png/-dark), logo-vertical.png, logo-compacto.png. El isotipo es geometría pura (rect 4,10,40×28 rx7 stroke 3 + rect 10,16,13×16 rx3). Chip «OS» siempre verde marca, nunca color de tenant.

## Files
- `tokens.padelclubos.json` — tokens de referencia y mapeo a variables CSS existentes.
- `*.dc.html` — abrir en navegador; cada frame lleva badge id (1a–3f).
- `assets/` — marca final.
