# Identidad «Marcador» — estado de implementación

Rediseño visual completo de PadelClub OS según `design_handoff_identidad_marcador/`
(README + `tokens.padelclubos.json` como fuente de verdad). Se implementa en 5 fases,
todas detrás de un feature flag, sin tocar lógica de negocio, APIs ni auth.

## Feature flag

- Variable: `NEXT_PUBLIC_TEMA_MARCADOR="true"` (build-time, ver `.env.example`).
- Helper: `temaMarcadorActivo()` en `src/lib/feature-flags.ts`.
- Efecto: `src/app/layout.tsx` añade la clase `theme-marcador` al `<body>` y cambia
  las fuentes (Inter/Sora → Instrument Sans/Archivo reutilizando las variables
  `--font-inter`/`--font-sora`, así Tailwind no cambia). Los tokens nuevos viven en
  `globals.css` bajo `.theme-marcador` (claro) y `.dark .theme-marcador` (oscuro).
- Con el flag apagado el aspecto es EXACTAMENTE el actual (cero cambios visuales).
- Al terminar la fase 5 se retiran el flag, el tema antiguo y las fuentes Inter/Sora.

## Qué cambia con el flag encendido (fase 1)

- Paleta papel/tinta: fondo `#F6F3ED`, texto `#1C1A17`, primario verde pista `#157A54`
  (oscuro: `#2FA075` con texto tinta). El azul deja de ser marca: solo estado informativo.
- Sidebar admin en tinta (`--sidebar-*` ya apuntan a los valores nuevos).
- Radios: `--radius` 10px (módulos) + primitivas `--radius-control/module/surface`.
- Tokens nuevos: `--surface-raised`, `--status-{info,success,warning,error}-{fg,bg,border}`,
  `--dataviz-1…6`, motion (`--motion-press/overlay/view/celebrate`, `--ease-overlay`,
  con `prefers-reduced-motion` → 80ms).
- Utilidades Tailwind nuevas: `surface-raised`, `info`/`success`/`warning`/`error`
  (+ `-bg`/`-border`), `dataviz-1…6`. Solo tienen valor con el flag activo.
- Tipografía: Instrument Sans (UI) + Archivo (display, `font-stretch: 112%` vía
  `.font-display`); `tabular-nums` automático en `<table>`.
- `themeColor` del viewport pasa a `#157A54`.

## Lint anti clases de color crudas

`npm run lint` ejecuta `scripts/lint-colores-crudos.mjs`: ratchet contra
`scripts/colores-crudos-baseline.json` (61 ficheros / 518 usos legados al crearla).
Falla si un fichero supera su baseline o un fichero nuevo usa paleta cruda de
Tailwind (`bg-blue-500`, `text-[#hex]`, …). En código nuevo usar siempre tokens
semánticos (`bg-primary`, `text-muted-foreground`, `text-info`, `bg-warning-bg`…).
Tras migrar una pantalla, fijar el avance con:
`node scripts/lint-colores-crudos.mjs --update`.

## Estado de fases

- [x] **Fase 1 — Foundations (S)**: tokens en `globals.css`, fuentes autohospedadas
  (next/font), lint anti colores crudos, flag `NEXT_PUBLIC_TEMA_MARCADOR`.
  Gate pendiente de ejecutar al encender el flag: regresión visual manual en
  4 breakpoints (360/768/1024/1440) × 2 temas.
- [x] **Fase 2 — Shell (M)**: `NavItem.group` + `agruparNavItems()` en `nav-items.ts`
  (Operación/Comunidad/Contenido/Negocio/Plataforma/Sistema, orden del prototipo 3a);
  Sidebar y MobileSidebar tinta 264px agrupadas (item activo: fondo `sidebar-accent`,
  barra izquierda 3px `sidebar-primary`, texto `sidebar-accent-foreground`; labels
  11px uppercase 0.08em); Header admin 56px sólido; MobileNavBar y bottom-nav del
  club sobre `surface-raised` con `safe-area-inset-bottom`; ClubLayout sin línea
  gradiente ni blur, logo cuadrado 10px, footer «Powered by PadelClub OS» monocromo
  60%; LogoIcon renderiza el isotipo nuevo (trazo `currentColor`, chip verde marca,
  prop `claseRelleno`). Pendiente de fase 4: rail 72px a 1024px (pantalla 3b) y
  búsqueda 220px con chip ⌘K en header (estético, opcional).
- [x] **Fase 3 — Componentes core (M)**: button (semibold, foco `outline 2px offset 2px`
  verde, disabled 45%, press 120ms, hover `primary-hover`, outline 1.5px
  `border-strong`, iconos stroke 1.75), input/textarea/select (borde 1.5px
  `border-strong` sobre `bg-card`, foco anillo suave 3px, error vía `aria-invalid`),
  badge (radio 6px, icono 12px, variantes `info/success/warning/error` con
  `*-foreground` oscurecidos para AA del Brand Kit), tabla (fila 40px, cabecera
  11px uppercase 0.08em), toast success con tokens, y componente nuevo
  `ui/kpi.tsx` (Archivo 28px tabular + tendencia flecha+texto). Tokens añadidos:
  `--primary-hover`, `--border-strong`, `--status-*-foreground`. Nota: los
  controles quedan en radio 8px (`rounded-md` con `--radius` 10px), que es lo que
  muestran los especímenes del Brand Kit; el "6px controles" del README del
  handoff solo aplica a badges. Legacy intacto con flag off (cva por rama).
- [x] **Fase 4 — Flujos críticos (L)**: `src/lib/tenant-theme.ts` (escala 50-900 en
  OKLCH desde `club.primaryColor`, croma máx 0.17, on-primary blanco/tinta según
  contraste ≥4.5:1 con oscurecimiento automático en la zona muerta, hover L∓6 /
  pressed L∓12, oscuro = tono 400). **Gate cumplido**: 18 tests en
  `tenant-theme.test.ts` con los 12 tenants extremos (AA en claro y oscuro).
  Integración: ClubLayout inyecta los pares `--tenant-*-claro/oscuro` (elegidos
  por `.ambito-tenant` en globals.css; replicados en `<body>` vía efecto para los
  portales de Radix); clases legacy `.club-nav-item`/`.club-bottom-pill` heredan
  el color ajustado vía `--club-primary`. CTA del jugador = `.btn-tenant`
  (hover/pressed reales) en ConfirmacionReserva (h-12). Ajustes: `PreviewTenant`
  (frame 3d) con check de contraste automático + preview claro/oscuro en vivo.
  GridReservas jugador (2b): filas 44px, chips de día (7 días), libre = borde
  punteado + precio, ocupada = trama diagonal `.celda-ocupada` (sin rojo), tuya =
  tinta, abierta = borde verde 1.5px, bloqueo = superficie secundaria + ban;
  campana waitlist en warning. CourtGridView admin (3b): bloques con borde
  izquierdo 3px por estado + icono (pagada = success + check, pendiente =
  warning + reloj + `.trama-warning`, partida = primary + users, bloqueo =
  border-strong + lock), slot libre punteado. Estado nunca solo por color
  (icono + texto + trama = requisito daltonismo). **Pendiente de fase 4** (anotado
  para fase 5): barra resumen sticky del flujo 2b, drawer de creación 392px y
  rail 72px del 3b, pantallas de éxito/fallo 2d con celebración única y
  retención 10 min (hoy son toasts funcionales).
- [x] **Fase 5 — Resto (M)**: neutralización CSS del legado bajo el flag (orbes
  ocultos, `auth-gradient-bg`/`landing-gradient-text` sin animación ni degradado,
  `landing-cta-pulse`/`landing-logo-scroll`/`notfound-bounce` sin animación
  continua, `auth-card-surface` y `club-section-dark` sobre tokens — todo en
  globals.css sin tocar componentes); avatares unificados en `src/lib/avatar.ts`
  (con flag: inicial sobre verde marca; se retira `#6366f1` y `random`);
  IngresosSemana con verde marca + trama diagonal warning en pendiente (patrón
  SVG, regla «pendiente siempre con trama»); CourtUtilization con semáforo de
  tokens de estado; badge de socio inactivo neutro con icono (3c); emails con
  `EMAIL_BRAND` Marcador (verde pista, papel/tinta, isotipo nuevo).
  BookingTrends/MemberGrowth ya usaban `hsl(var(--primary))` → adoptan el verde
  solos. Rankings/competiciones/socios/plataforma se apoyan en tokens y
  componentes core ya migrados.

## Pendiente post-gate (tras validar visualmente con el flag encendido)

1. Retirar flag + tema antiguo: eliminar ramas legacy de componentes, clases
   `auth-*`/`landing-*` de globals.css (hoy solo neutralizadas), fuentes
   Inter/Sora, y bajar la baseline del ratchet migrando los ~518 usos crudos
   restantes (sobre todo marketing).
2. Flujos aplazados: barra resumen sticky (2b), drawer creación 392px + rail
   72px (3b), pantallas éxito/fallo 2d (celebración única 400ms, retención 10
   min), confirmación destructiva escribiendo el nombre (3e), banda tinta de
   plataforma (3e).
3. Gate visual de fase 1 pendiente de ejecutar: 4 breakpoints × 2 temas con el
   flag encendido (`NEXT_PUBLIC_TEMA_MARCADOR="true"` en `.env.local`).

## Notas para las siguientes fases

- Los `.dc.html` del handoff son referencia, no código: recrear con shadcn/cva.
- Badges de estado en oscuro (del Brand Kit): texto = fg oscuro, fondo = fg al 14%,
  borde = fg al 35% (ya precalculados como sólidos en los tokens `--status-*`).
- «Pendiente/estimado» siempre con trama además de color (dataviz y ocupación).
- Prohibido: animación continua, shimmer, orbes, glassmorphism.
- Touch ≥44px en jugador; `tabular-nums` en KPIs, precios y horas (en tablas ya es
  automático con el flag).
