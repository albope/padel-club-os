# CLAUDE.md - Padel Club OS

## Proyecto

App fullstack de gestion de clubes de padel. Next.js 14 + TypeScript + Prisma + PostgreSQL.

## Stack

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript (strict mode)
- **DB**: PostgreSQL con Prisma ORM 6.19
- **Auth**: NextAuth v4 (CredentialsProvider, JWT, bcrypt) + RBAC
- **UI**: shadcn/ui + Tailwind CSS + lucide-react
- **Formularios**: react-hook-form + zod
- **Tema**: next-themes (light/dark)
- **i18n**: next-intl 4 (es/en, locale fijo por ahora)
- **Charts**: recharts 3.7
- **Email**: resend (emails transaccionales con plantilla branded)
- **Push**: web-push (notificaciones push via VAPID)
- **Logging**: logger estructurado (JSON en prod, legible en dev)

## Estructura

```
src/
  app/
    (public)/       # Landing + paginas marketing (layout con Navbar + Footer)
      sobre-nosotros/ # Pagina "Quienes somos"
      contacto/     # Pagina de contacto con formulario
      cookies/      # Politica de cookies
      privacidad/   # Politica de privacidad (RGPD)
      terminos/     # Terminos y condiciones
      blog/         # Blog publico (listado + detalle por slug)
        [slug]/      # Articulo individual
    api/            # API Routes (REST)
      auth/         # NextAuth handler + forgot-password + reset-password
      blog/         # CRUD blog plataforma (blog:read/create/update/delete)
        public/     # API publica blog (listado + detalle por slug)
      bookings/     # CRUD reservas (admin) + export CSV
      club/         # Ajustes club + API publica /club/[slug] + rankings
      competitions/ # CRUD competiciones, equipos, partidos
      contact/      # Formulario contacto (publico, guarda en DB + email)
      courts/       # CRUD pistas + pricing
      cron/         # Tareas programadas (booking-reminders)
      news/         # CRUD noticias (news:read/create/update/delete)
      notifications/ # CRUD notificaciones + subscribe + vapid-key
      open-matches/ # CRUD partidas abiertas (admin)
      payments/     # Export pagos CSV
      player/       # APIs de jugador (bookings, open-matches, profile, stats)
      register/     # Registro admin + /register/player
      search/       # Busqueda global (socios, pistas, reservas)
      stripe/       # Checkout, portal, webhook
      users/        # CRUD socios + importacion + export CSV
    club/[slug]/    # Portal publico del club (jugadores)
      login/        # Login jugador
      registro/     # Registro jugador
      forgot-password/ # Recuperar contraseña jugador
      reservar/     # Reservar pista
      partidas/     # Partidas abiertas (paginadas, con filtros)
      competiciones/ # Ver competiciones (solo lectura)
      noticias/     # Ver noticias del club (listado + detalle)
      rankings/     # Rankings ELO del club
      perfil/       # Perfil del jugador
      tarifas/      # Tarifas publicas del club
    dashboard/      # Panel admin (layout con sidebar)
      noticias/     # CRUD noticias (nueva, editar, listar)
      blog/         # CRUD blog plataforma (nuevo, editar, listar)
      analiticas/   # Dashboard de analiticas con graficos
      facturacion/  # Facturacion Stripe
      rankings/     # Rankings ELO admin
    forgot-password/ # Recuperar contraseña admin
    reset-password/  # Restablecer contraseña con token
    login/          # Login admin
    register/       # Registro admin (crea club)
    not-found.tsx   # Pagina 404 personalizada
    manifest.ts     # PWA manifest
    sw.ts           # Service Worker
  components/
    ui/             # shadcn/ui (21 componentes, incluye popover, scroll-area)
    layout/         # Header, Sidebar, MobileNavBar, MobileSidebar, Breadcrumbs, ThemeToggle, NotificationBell, PushNotificationPrompt, GlobalSearch, CookieBanner
    dashboard/      # DashboardClient (resumen del club)
    club/           # ClubLayout, ClubHome, GridReservas, NuevaPartidaJugadorForm, ConfirmacionReserva, Leaderboard
    marketing/      # Hero, Features, Pricing, Testimonials, CTA, Navbar, Footer, ContactForm
    noticias/       # NoticiasClient, NewsForm (admin CRUD noticias)
    blog/           # BlogListClient, BlogForm (admin CRUD blog plataforma)
    analiticas/     # AnaliticasClient, StatsCards, BookingTrends, MemberGrowth, CourtUtilization, PeakHours
    competitions/   # Ligas y torneos
    reservas/       # Reservas de pistas (CalendarView, CourtGridView, BookingModal)
    pistas/         # Gestion de pistas
    socios/         # Gestion de socios
    partidas-abiertas/ # Buscar partidas (admin)
    ajustes/        # Configuracion del club
    auth/           # AuthForm, AuthBrandingPanel
    not-found/      # BotonVolver (pagina 404)
  lib/
    auth.ts         # Config de NextAuth (role + clubName en JWT/session)
    api-auth.ts     # requireAuth() helper con permisos RBAC
    permissions.ts  # Definicion de permisos por rol (~41 permisos)
    stripe.ts       # Cliente Stripe lazy (Proxy pattern), PLAN_PRICES
    email.ts        # Cliente Resend lazy, plantilla branded, 7 emails transaccionales
    pricing.ts      # calcularPrecioReserva(), obtenerPreciosPista()
    notifications.ts # Crear notificaciones + enviar push
    web-push.ts     # Cliente web-push lazy (Proxy pattern)
    elo.ts          # Sistema ELO para padel dobles (calculateMatchRatings, eloANivel)
    csv.ts          # Utilidades CSV (escaparCSV, generarCSV, formatearFechaCSV)
    rate-limit.ts   # Rate limiting en memoria (crearRateLimiter, obtenerIP)
    logger.ts       # Logger estructurado (JSON en prod, legible en dev)
    tokens.ts       # Tokens de recuperacion de contraseña (SHA-256, 1h expiracion)
    seo.ts          # Constantes SEO (SITE_URL, SITE_NAME, SITE_DESCRIPTION)
    subscription.ts # Validacion de suscripcion Stripe (isSubscriptionActive, canCreate*)
    db.ts           # Prisma client singleton
    utils.ts        # cn() helper
    nav-items.ts    # Items de navegacion admin
  i18n/
    request.ts      # Config next-intl (locale fijo 'es')
  types/            # Tipos TS (next-auth.d.ts)
  hooks/            # Custom hooks (use-toast, use-push-notifications)
  middleware.ts     # Proteccion de rutas por rol
  test/             # Setup Vitest + utils
messages/
  es.json           # Traducciones espanol
  en.json           # Traducciones ingles
prisma/
  schema.prisma     # 18 modelos (ver seccion Modelos)
scripts/
  generate-icons.js # Generador de iconos PWA
public/
  icons/            # Iconos PWA (192, 512, maskable, apple-touch, svg)
```

## Convenciones

- **Idioma**: Todo en espanol (variables, UI, comentarios, commits)
- **Componentes**: PascalCase, `'use client'` solo cuando hay hooks/formularios
- **API Routes**: Usar `requireAuth(permission)` de `@/lib/api-auth`, NUNCA getServerSession directo
- **Errores API**: `logger.error("TAG", "mensaje", contexto, error)` de `@/lib/logger` + try/catch
- **Validacion**: Zod schemas, tanto en forms como en API
- **CSS**: Usar `cn()` para clases condicionales, nunca inline styles
- **Imports**: Alias `@/*` apunta a `./src/*`

## Comandos

```bash
npm run dev        # Desarrollo (puerto 3000)
npm run build      # Build produccion
npm run lint       # ESLint
npm test           # Vitest (run once)
npm run test:watch # Vitest (watch mode)
npx prisma studio  # Ver DB
npx prisma db push # Sincronizar schema con DB
```

## Modelos principales (Prisma)

- **Club**: Centro multi-tenant. Config: description, phone, email, primaryColor, maxAdvanceBooking, cancellationHours, enableOpenMatches, enablePlayerBooking, bookingPaymentMode, bannerUrl, instagramUrl, facebookUrl, bookingDuration. Stripe: stripeSubscriptionId, subscriptionStatus, trialEndsAt, stripeConnectAccountId, stripeConnectOnboarded
- **User**: Pertenece a un Club, role (SUPER_ADMIN, CLUB_ADMIN, STAFF, PLAYER). Campos: adminNotes, isActive, birthDate
- **Court**: Pistas del club (name, type). Relacion: pricings (CourtPricing[])
- **Booking**: Reservas con solapamiento. Campos: cancelledAt, cancelReason, totalPrice, paymentStatus (pending|paid|exempt), reminderSentAt
- **Payment**: Pagos (amount, currency, status, type booking|subscription, stripePaymentId unique, bookingId, userId, clubId)
- **CourtPricing**: Precios por pista/dia/hora (courtId, dayOfWeek 0-6, startHour, endHour, price, @@unique[courtId, dayOfWeek, startHour])
- **Competition**: Ligas/torneos (LEAGUE, KNOCKOUT, GROUP_AND_KNOCKOUT), status (ACTIVE, FINISHED)
- **Team**: 2 jugadores por equipo, stats (points, played, won, lost, sets, games)
- **Match**: Partidos de competicion (resultados formato "6-2 6-4")
- **OpenMatch**: Partidas abiertas por nivel (OPEN, FULL, CONFIRMED, CANCELLED)
- **OpenMatchPlayer**: Jugadores en partida abierta (tabla pivot)
- **News**: Noticias del club (title, content, published)
- **PlayerStats**: Estadisticas de jugador (eloRating, matchesPlayed, matchesWon, setsWon/Lost, gamesWon/Lost, winStreak, bestWinStreak). @@unique[userId, clubId]
- **Notification**: Notificaciones in-app (type, title, message, read, metadata JSON, userId, clubId). Tipos: booking_confirmed/cancelled/reminder, open_match_created/full/joined, news_published
- **PushSubscription**: Suscripciones push (endpoint, p256dh, auth, userId). @@unique[endpoint]
- **ContactSubmission**: Mensajes del formulario de contacto (nombre, email, asunto, mensaje, leido). Sin clubId (plataforma)
- **BlogPost**: Articulos del blog (title, slug unique, content, excerpt, category, imageUrl, published, authorName, readTime). Sin clubId (plataforma)
- **PasswordResetToken**: Tokens de recuperacion de contraseña (email, token SHA-256, expires, @@index[email])

## Auth y RBAC

- Session extiende con `id`, `clubId`, `clubName` y `role` (ver `src/types/next-auth.d.ts`)
- **requireAuth(permission)**: valida sesion + clubId + permiso en una llamada
- **isAuthError(result)**: type guard para verificar si es NextResponse de error
- **Middleware**: protege /dashboard (solo ADMIN_ROLES), permite /club/* publicamente, excluye /api/stripe/webhook, /api/contact, /api/blog/public, /api/auth/forgot-password, /api/auth/reset-password
- **Permisos**: definidos en `src/lib/permissions.ts`, ~41 permisos por 4 roles

### Patron de uso en API routes:
```typescript
import { requireAuth, isAuthError } from "@/lib/api-auth"

export async function GET() {
  const auth = await requireAuth("bookings:read")
  if (isAuthError(auth)) return auth
  // auth.session.user.id, auth.session.user.clubId, auth.session.user.role
}
```

### Roles y permisos:
- **SUPER_ADMIN / CLUB_ADMIN**: acceso total (incluye news:*, blog:*, analytics:read, billing:*, notifications:*)
- **STAFF**: gestionar reservas, pistas, competiciones; ver socios, noticias, analiticas y notificaciones
- **PLAYER**: crear reserva propia, unirse a partidas, ver competiciones, gestionar perfil, ver notificaciones

## Plan maestro

El plan completo de 5 fases esta en: `C:\Users\alber\.claude\plans\jaunty-tumbling-sunrise.md`

**Objetivo**: Convertir Padel Club OS en la plataforma de referencia para clubes de padel en Espana, superando a TPC Matchpoint.

**Decisiones tomadas**:
- Tema: Light por defecto + Dark mode
- Movil: PWA (Progressive Web App)
- UI: shadcn/ui (Radix UI + Tailwind)
- ORM: Prisma 6 (upgrade a 7 cuando Node se actualice a 20.19+)
- Pagos de pistas: Online (Stripe) + Presencial, configurable por club
- Pricing SaaS: Starter 19EUR, Pro 49EUR, Enterprise 99EUR (sin tier gratuito)
- Landing: Doble enfoque (clubes no digitalizados + clubes hartos de software rigido)
- Arquitectura: Monolito Next.js con route groups

**Fases**:
1. Fundacion (design system, mobile, UX) - COMPLETADA
2. Portal publico + RBAC - COMPLETADA
3. Pagos, noticias, analiticas, marketing, notificaciones - COMPLETADA
4. Rankings, social, reservas avanzadas - EN PROGRESO
5. Crecimiento (multi-deporte, API, white-label, real-time)

## Estado - Fase 1 (Fundacion) - COMPLETADA

- [x] Prisma 5 -> 6.19, shadcn/ui (16 componentes), temas light/dark
- [x] Navegacion movil (MobileSidebar + MobileNavBar), Breadcrumbs, Error boundaries, Skeletons
- [x] TODOS los componentes migrados al design system
- [x] TODOS los window.alert -> toast, TODOS los window.confirm -> AlertDialog
- [x] DB schema: UserRole enum, slug unico en Club
- [x] Auth: role en JWT/session/authorize
- [x] Vitest 2 + @testing-library/react + jsdom

## Estado - Fase 2 (Portal Publico + RBAC) - COMPLETADA

- [x] Schema Prisma: campos config en Club, cancelacion en Booking, modelo News
- [x] RBAC: permissions.ts, api-auth.ts (requireAuth), middleware.ts
- [x] TODAS las API routes migradas a requireAuth() con permisos especificos
- [x] API registro jugadores: /api/register/player (requiere slug valido)
- [x] APIs jugadores: /api/player/bookings, /api/player/open-matches, /api/player/profile
- [x] API publica: /api/club/[slug], /api/club/[slug]/courts
- [x] Portal club completo: /club/[slug] (7 paginas: home, reservar, partidas, competiciones, detalle competicion, perfil, login, registro)
- [x] Layout responsive con nav desktop + bottom nav movil + branding dinamico
- [x] i18n: next-intl 4, mensajes es.json + en.json, NextIntlClientProvider en root layout
- [x] Build exitoso sin errores

## Estado - Fase 3.1 (Stripe + Precios Dinamicos) - COMPLETADA

- [x] Stripe SDK instalado (stripe, @stripe/stripe-js, @stripe/react-stripe-js)
- [x] Schema Prisma: modelos Payment, CourtPricing, campos Stripe en Club, paymentStatus en Booking
- [x] src/lib/stripe.ts: cliente Stripe lazy (Proxy pattern), PLAN_PRICES, helpers
- [x] src/lib/pricing.ts: calcularPrecioReserva(), obtenerPreciosPista()
- [x] Permisos RBAC: billing:read/update, court-pricing:read/update
- [x] Middleware: /api/stripe/webhook excluido de auth
- [x] APIs Stripe: /api/stripe/checkout, /api/stripe/portal, /api/stripe/webhook
- [x] Pagina facturacion: /dashboard/facturacion (BillingOverview + PricingPlans)
- [x] SubscriptionBanner en dashboard layout (trial, past_due, canceled)
- [x] Navegacion: item "Facturacion" en sidebar
- [x] Registro con trial: 14 dias gratis al crear club
- [x] i18n: seccion "billing" en es.json y en.json
- [x] API precios pista: /api/courts/[courtId]/pricing (GET, POST)
- [x] UI precios pista: /dashboard/pistas/[courtId]/precios (grid dias x horas)
- [x] Precio dinamico: reemplazado hardcoded 20.0 en bookings, player/bookings, open-matches
- [x] API publica precios: /api/club/[slug]/pricing
- [x] Precios en reserva jugador: slots muestran precio, confirmacion muestra total
- [x] Formulario ajustes expandido: bookingPaymentMode, description, phone, email, toggles
- [x] Build exitoso sin errores

## Estado - Fase 3.2 (Noticias, Analiticas, Marketing) - COMPLETADA

- [x] Sistema de noticias completo: CRUD admin (/dashboard/noticias) + vista publica (/club/[slug]/noticias)
- [x] API noticias: /api/news (GET, POST), /api/news/[newsId] (GET, PATCH, DELETE)
- [x] Permisos RBAC: news:read/create/update/delete, analytics:read, blog:read/create/update/delete
- [x] Dashboard analiticas: /dashboard/analiticas (recharts: tendencias, crecimiento, utilizacion pistas, horas punta)
- [x] Componentes analiticas: StatsCards, BookingTrends, MemberGrowth, CourtUtilization, PeakHours
- [x] Paginas marketing: /sobre-nosotros, /contacto, /cookies, /blog
- [x] Navegacion admin: items Noticias, Blog y Analiticas en sidebar
- [x] Auth: clubName en JWT/session (se muestra en Header dropdown y Dashboard)
- [x] Formulario contacto: react-hook-form + zod, API /api/contact (guarda en DB + envia email con Resend), rate limiting
- [x] Blog completo: modelo BlogPost, CRUD admin /dashboard/blog, API /api/blog, pagina publica dinamica /blog + /blog/[slug]
- [x] Resend instalado para emails de contacto (lazy init como Stripe)
- [x] Navbar marketing: link al blog con navegacion SPA
- [x] Build exitoso sin errores

## Estado - Fase 3.3 (Notificaciones + PWA + Partidas mejoradas) - COMPLETADA

- [x] Schema Prisma: modelos Notification, PushSubscription, PlayerStats
- [x] Notificaciones in-app: API /api/notifications (GET, PATCH), /api/notifications/[notificationId] (PATCH marcar leida)
- [x] Push notifications: /api/notifications/subscribe, /api/notifications/vapid-key, web-push
- [x] src/lib/notifications.ts: crearNotificacion() + envio push automatico
- [x] src/lib/web-push.ts: cliente web-push lazy (Proxy pattern)
- [x] Componentes: NotificationBell (campana con badge contador), PushNotificationPrompt (solicitar permiso)
- [x] Hook: use-push-notifications.ts (registro SW, suscripcion VAPID)
- [x] Permisos RBAC: notifications:read, notifications:update (todos los roles)
- [x] Notificaciones integradas en: reservas jugador, partidas abiertas (crear/unirse), noticias publicadas
- [x] PWA: manifest.ts, service worker (sw.ts), iconos en public/icons/
- [x] Partidas abiertas mejoradas: paginacion (6/pagina), filtros (fecha con dia concreto limitado por maxAdvanceBooking, pista, disponibilidad abiertas/completas/mis partidas, nivel)
- [x] API publica club: se expone maxAdvanceBooking
- [x] i18n: seccion "notifications" en es.json y en.json

## Estado - Fase 4 (Rankings, seguridad, mejoras) - EN PROGRESO

- [x] Recuperacion de contraseña: /forgot-password, /reset-password, /club/[slug]/forgot-password
- [x] API auth: /api/auth/forgot-password (rate limiting 3/IP/15min), /api/auth/reset-password (tokens SHA-256, 1h expiracion)
- [x] src/lib/tokens.ts: generarToken(), hashToken(), guardarToken(), verificarToken() (tokens de un solo uso)
- [x] src/lib/email.ts: 7 emails transaccionales con plantilla branded (ver Roadmap B1)
- [x] Schema Prisma: modelo PasswordResetToken
- [x] Banner cookies RGPD: CookieBanner.tsx con opciones esenciales/aceptar todo (localStorage)
- [x] Paginas legales: /privacidad (RGPD), /terminos
- [x] Recordatorios de reserva: /api/cron/booking-reminders (push 1h antes, compatible Vercel Cron, CRON_SECRET)
- [x] Schema Prisma: campo reminderSentAt en Booking
- [x] Rankings ELO: src/lib/elo.ts (calculateMatchRatings, K-factor dinamico, eloANivel 1.0-7.0, rating base 1500)
- [x] Rankings admin: /dashboard/rankings (tabla completa stats jugadores)
- [x] Rankings jugador: /club/[slug]/rankings (Leaderboard con tabs: ranking, stats personales, info ELO)
- [x] API rankings: /api/club/[slug]/rankings (GET publico, limit 100), /api/player/stats (GET stats + posicion)
- [x] Componente Leaderboard.tsx: medallas top 3, tabs ranking/stats/info, rachas, win rate %
- [x] Busqueda global: GlobalSearch.tsx (Ctrl+K, busca socios/pistas/reservas, debounce 300ms, navegacion teclado)
- [x] API busqueda: /api/search?q=query (requiere bookings:read)
- [x] Exportaciones CSV: /api/bookings/export, /api/payments/export, /api/users/export (filtros fecha, UTF-8 BOM)
- [x] src/lib/csv.ts: escaparCSV(), generarCSV(), formatearFechaCSV(), formatearHoraCSV()
- [x] Pagina 404 personalizada: not-found.tsx (SVG padel, orbes animados, gradiente azul/cyan)
- [x] i18n: secciones cookies, auth en es.json y en.json

**Siguiente: Validacion APIs (B2), tests (C1)**

## Notas

- El postinstall ejecuta `prisma generate` automaticamente
- Variables de entorno: `DATABASE_URL`, `AUTH_SECRET`, `RESEND_API_KEY`, `CONTACT_EMAIL`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `CRON_SECRET` (en .env)
- Componentes shadcn se generan en `src/components/ui/`
- Node.js 20.19.0
- Prisma generate puede fallar con EPERM si el dev server tiene el DLL bloqueado - parar dev server primero
- Para usar toast: `import { toast } from '@/hooks/use-toast'`
- Toast de error: `toast({ title: "Error", description: "...", variant: "destructive" })`
- Toast de exito: `toast({ title: "Exito", description: "...", variant: "success" })`

## Continuacion de sesion

Cuando el usuario diga "CONTINUACION DE SESION ANTERIOR", lee estos archivos para retomar contexto:
1. Este CLAUDE.md - plan maestro, stack, convenciones, estado actual
2. `FUNCIONAL.md` (raiz) - documento funcional completo con estado de cada seccion

Revisa las secciones de estado en CLAUDE.md y el roadmap para ver que esta COMPLETADO y que esta PENDIENTE. Identifica la fase actual y continua desde donde lo dejamos con la siguiente tarea pendiente. Pregunta si no tienes claro por donde seguir.

## Roadmap para lanzamiento al mercado

### BLOQUE A: CRITICO (sin esto no se lanza)

**Sesion A1 - Enforcement de suscripcion Stripe** `[x]`
- [x] src/lib/subscription.ts: isSubscriptionActive(), getSubscriptionInfo(), canCreateCourt/Member/Admin()
- [x] subscriptionStatus y trialEndsAt en JWT token (auth.ts) para verificacion sin DB en middleware
- [x] requireAuth() acepta `{ requireSubscription: true }` - bloquea operaciones si trial expirado/cancelado
- [x] Middleware redirige /dashboard/* a /dashboard/facturacion si suscripcion inactiva (excepto /facturacion y /ajustes)
- [x] Gating por plan: canCreateCourt (Starter: max 4), canCreateMember (Starter: 50, Pro: 500), canCreateAdmin
- [x] API routes protegidas: courts:create, users:create, bookings:create, competitions:create, open-matches:create, news:create
- [x] Registro jugador: verifica suscripcion activa + limite socios del club
- [x] Webhook customer.subscription.trial_will_end: notifica admins 3 dias antes
- [x] SubscriptionBanner mejorado: banners criticos no cerrables (canceled, trial expirado)
- [x] SubscriptionGate.tsx: componente reutilizable para bloqueo visual
- [x] Build exitoso

**Sesion A2 - Cabeceras de seguridad** `[x]`
- [x] Security headers en next.config.mjs: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, X-DNS-Prefetch-Control
- [x] src/lib/rate-limit.ts: crearRateLimiter() factory + obtenerIP() (reemplaza codigo duplicado)
- [x] Rate limiting centralizado: forgot-password (3/15min), reset-password (5/15min), contact (3/15min), register admin (5/1h), register player (5/1h)
- [x] Zod validation en /api/register y /api/register/player (antes no tenian schemas)
- [x] .max() constraints en todos los schemas Zod: news, blog, contact, register
- [x] Build exitoso

**Sesion A3 - SEO basico** `[x]`
- [x] `robots.ts` (dynamic) + `sitemap.ts` (dynamic, incluir paginas publicas + clubs + blog posts)
- [x] Open Graph + Twitter Cards en layout.tsx raiz
- [x] `generateMetadata` en todas las paginas publicas (landing, sobre-nosotros, contacto, blog, club portal)
- [x] JSON-LD de Organization + SoftwareApplication en landing
- [x] src/lib/seo.ts: SITE_URL, SITE_NAME, SITE_DESCRIPTION, SITE_LOCALE
- [x] Build exitoso

**Sesion A4 - Compliance RGPD real** `[x]`
- [x] Cookie banner que realmente bloquee scripts no esenciales (ScriptConsentido.tsx + use-consentimiento.ts)
- [x] API `/api/player/data-export` (derecho de portabilidad - exportar datos personales)
- [x] API `/api/player/data-delete` (derecho al olvido - anonimizar/eliminar datos)
- [x] API `/api/consent` - Log de consentimiento (guardar cuando el usuario acepto cookies y que tipo)
- [x] Build exitoso

**Sesion A5 - Error boundaries + health check** `[x]`
- [x] `error.tsx` en raiz, `(public)`, `club/[slug]`, `dashboard`
- [x] `loading.tsx` en paginas principales (ajustes, analiticas, blog, facturacion, noticias, rankings)
- [x] API `/api/health` (check DB connection, devuelve status)
- [x] Build exitoso

### BLOQUE B: IMPORTANTE (lanzamiento beta robusto)

**Sesion B1 - Emails transaccionales** `[x]`
- [x] Plantilla HTML base reutilizable: header gradiente azul/cyan con logo SVG, footer legal, boton CTA
- [x] Helpers: escaparHtml (XSS), cajaDetalle, formatearFecha/Hora, traducirEstadoPago
- [x] Email bienvenida admin (registro club, info trial 14 dias, pasos rapidos)
- [x] Email bienvenida jugador (registro en club, acciones disponibles)
- [x] Email confirmacion de reserva (ficha detalle: pista, fecha, hora, precio, estado pago)
- [x] Email cancelacion de reserva (ficha tachada, CTA re-reservar)
- [x] Email recordatorio de reserva (1h antes, complemento al push del cron)
- [x] Rebrandeados emails existentes (reset password, contacto) con la plantilla
- [x] Todos los envios fire-and-forget (.catch), nunca bloquean APIs
- [x] Build exitoso

**Sesion B2 - Validacion completa APIs** `[x]`
- [x] src/lib/validation.ts: helper `validarBody(schema, body)` con discriminated union tipado
- [x] Zod schemas en 22 rutas API con mutaciones (5 grupos: CRUD core, competiciones, partidas, precios, player bookings)
- [x] Schemas con validaciones estrictas: .min(), .max(), regex, enums, .refine() para reglas de negocio
- [x] Reemplazada validacion manual (`if (!field)`) por schemas Zod en todas las rutas con body
- [x] Build exitoso

**Sesion B3 - Onboarding admin** `[x]`
- [x] EmptyState.tsx: componente reutilizable para estados vacios (icono, titulo, descripcion, CTA opcional)
- [x] Empty states mejorados en 6 paginas: Pistas, Socios, Competiciones, Noticias, Partidas, Dashboard
- [x] OnboardingChecklist.tsx: widget de progreso en dashboard (5 pasos, barra progreso, dismiss localStorage)
- [x] SetupWizard.tsx: wizard 4 pasos (info club, crear pistas, configurar precios, resumen)
- [x] /dashboard/configuracion-inicial: pagina del wizard + loading skeleton
- [x] Dashboard ampliado: queries de courtPricing.count, player count, calculo onboardingPasos
- [x] Middleware: /dashboard/configuracion-inicial en SUBSCRIPTION_EXEMPT_PATHS
- [x] i18n: seccion "onboarding" en es.json y en.json
- [x] Build exitoso

**Sesion B4 - Monitoring + logging** `[x]`
- [x] src/lib/logger.ts: logger estructurado (JSON en prod, legible en dev, reporta a Sentry)
- [x] Logger integrado en APIs criticas (register, bookings, cron, webhook, notifications)
- [x] Sentry SDK: @sentry/nextjs con configs server/edge/client, instrumentation hook, onRequestError
- [x] next.config.mjs: withSentryConfig wrapper, instrumentationHook, CSP (sentry-cdn + ingest.sentry.io)
- [x] global-error.tsx: error boundary de ultimo recurso con Sentry
- [x] 4 error.tsx existentes: +Sentry.captureException via import dinamico
- [x] .env.example: 17 variables documentadas en espanol
- [x] .gitignore: excepcion para .env.example
- [x] Build exitoso

**Sesion B5 - Performance basica** `[x]`
- [x] 18 @@index en Prisma: Booking (4), User (2), Court (1), OpenMatch (2), News (2), Competition (1), Payment (2), PlayerStats (2), BlogPost (1), CourtPricing (1)
- [x] Cache-Control headers en 7 API routes publicas (club, courts, pricing, rankings, availability, blog)
- [x] revalidate en 8 Server Components (blog, club portal, tarifas, rankings, noticias)
- [x] next/image: remotePatterns config + migradas 13 instancias <img> en 11 archivos (avatares + contenido)
- [x] Build exitoso

### BLOQUE C: VALOR AÑADIDO (diferenciador competitivo)

**Sesion C1 - Tests criticos** `[ ]`
- Tests unitarios para: `requireAuth`, `pricing.ts`, `tokens.ts`, `csv.ts`, `notifications.ts`
- Tests de API: auth flows, bookings CRUD, stripe webhook
- Target: 40-50% coverage en rutas criticas

**Sesion C2 - Stripe Connect (pagos de reservas)** `[ ]`
- Onboarding Stripe Connect para clubs
- Cobro al jugador al reservar (modo "online")
- Split payment: club recibe el pago, plataforma cobra comision

**Sesion C3 - Comunicacion masiva** `[ ]`
- Enviar email/push a todos los socios del club
- Segmentacion basica (todos, por nivel, activos/inactivos)

**Sesion C4 - Reservas recurrentes** `[ ]`
- Modelo `RecurringBooking` (dia semana, hora, pista, usuario, fecha fin)
- Cron job que genera reservas automaticas semanalmente
- UI admin para crear/editar/cancelar clases fijas

**Sesion C5 - i18n completo** `[ ]`
- Migrar strings hardcoded de marketing y dashboard a `messages/`
- Selector de idioma en navbar + portal club

**Sesion C6 - Pago por jugador en reservas y partidas abiertas** `[ ]`
- Modelo `BookingPayment` (bookingId, userId, amount, status pending/paid, paidAt, collectedBy)
- Dividir totalPrice entre jugadores de la reserva (2 o 4 jugadores)
- Aplica a reservas normales (Booking) y partidas abiertas (OpenMatch con su Booking asociado)
- En partidas abiertas: division automatica al confirmar partida (4 jugadores de OpenMatchPlayer)
- API admin: marcar pago individual por jugador (PATCH /api/bookings/[id]/player-payment)
- UI admin: en PendingPayments mostrar desglose por jugador con boton "Cobrar" individual
- Booking.paymentStatus se marca "paid" automaticamente cuando todos los jugadores han pagado
- Vista recepcion: ver quien ha pagado y quien falta

### BLOQUE D: PULIDO (post-lanzamiento)

**Sesion D1** - Accesibilidad (skip-to-content, focus trap modals, aria-describedby, WCAG 2.1 AA) `[ ]`
**Sesion D2** - E2E tests con Playwright `[ ]`
**Sesion D3** - Dashboard mejorado (revenue chart, agenda del dia) `[ ]`
**Sesion D4** - Social (chat jugadores, valoraciones, buscar jugadores) `[ ]`
**Sesion D5** - CI/CD (GitHub Actions: lint + test + build en PR) `[ ]`

### Orden recomendado
Sprint 1: A1, A2 [DONE] → Sprint 2: A3, A5 [DONE] → Sprint 3: A4, B1 [DONE] → Sprint 4: B4, B3 [DONE] → Sprint 5: B2 [DONE], B5 [DONE] → Sprint 6: C1 → Beta launch → Sprint 7+: C2-C5, D1-D5
