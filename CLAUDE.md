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
      cron/         # Tareas programadas (booking-reminders, generate-recurring-bookings)
      recurring-bookings/ # CRUD reservas recurrentes (GET, POST, PATCH, DELETE)
      news/         # CRUD noticias (news:read/create/update/delete)
      broadcasts/   # Comunicacion masiva (GET historial, POST enviar, preview)
      notifications/ # CRUD notificaciones + subscribe + vapid-key
      open-matches/ # CRUD partidas abiertas (admin)
      payments/     # Export pagos CSV
      player/       # APIs de jugador (bookings, open-matches, profile, stats, ratings, chat, waitlist)
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
      jugadores/    # Directorio de jugadores + perfil publico [userId]
      perfil/       # Perfil del jugador
      tarifas/      # Tarifas publicas del club
    dashboard/      # Panel admin (layout con sidebar)
      noticias/     # CRUD noticias (nueva, editar, listar)
      comunicacion/ # Comunicacion masiva (historial + nuevo envio)
      reservas-recurrentes/ # Clases fijas (lista, crear, editar)
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
    comunicacion/   # ComunicacionClient (historial), BroadcastForm (formulario envio)
    reservas-recurrentes/ # ReservasRecurrentesClient (lista), RecurringBookingForm (crear/editar)
    blog/           # BlogListClient, BlogForm (admin CRUD blog plataforma)
    analiticas/     # AnaliticasClient, StatsCards, BookingTrends, MemberGrowth, CourtUtilization, PeakHours
    competitions/   # Ligas y torneos
    reservas/       # Reservas de pistas (CalendarView, CourtGridView, BookingModal)
    pistas/         # Gestion de pistas
    socios/         # Gestion de socios
    partidas-abiertas/ # Buscar partidas (admin)
    social/         # JugadoresClient, PlayerCard, EstrellasDisplay/Input, ValoracionesWidget, PartidaChat
    ajustes/        # Configuracion del club
    auth/           # AuthForm, AuthBrandingPanel
    not-found/      # BotonVolver (pagina 404)
  lib/
    auth.ts         # Config de NextAuth (role + clubName en JWT/session)
    api-auth.ts     # requireAuth() helper con permisos RBAC
    permissions.ts  # Definicion de permisos por rol (~43 permisos)
    stripe.ts       # Cliente Stripe lazy (Proxy pattern), PLAN_PRICES
    email.ts        # Cliente Resend lazy, plantilla branded, 8 emails transaccionales
    broadcast.ts    # Comunicacion masiva: resolverSegmento(), enviarBroadcast()
    pricing.ts      # calcularPrecioReserva(), obtenerPreciosPista()
    notifications.ts # Crear notificaciones + enviar push
    web-push.ts     # Cliente web-push lazy (Proxy pattern)
    elo.ts          # Sistema ELO para padel dobles (calculateMatchRatings, eloANivel)
    waitlist.ts     # Lista de espera: liberarSlotYNotificar(), limpiarWaitlistAlReservar()
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
  schema.prisma     # 20 modelos (ver seccion Modelos)
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
- **Booking**: Reservas con solapamiento. Campos: cancelledAt, cancelReason, totalPrice, numPlayers (default 4), paymentStatus (pending|paid|exempt), reminderSentAt, recurringBookingId?. Relacion: bookingPayments[]
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
- **Broadcast**: Comunicaciones masivas (title, message, channels push/email/push+email, segment all/active/inactive/level:X, recipientCount, status sending/sent/failed, sentById, clubId). @@index[clubId]
- **RecurringBooking**: Clases fijas/reservas recurrentes (description, dayOfWeek 0-6, startHour/Minute, endHour/Minute, isActive, startsAt, endsAt, courtId, userId, guestName, clubId). Relacion: bookings[]. @@index[clubId], @@index[clubId, isActive]
- **BookingPayment**: Pagos por jugador - tracking recepcion (bookingId, userId?, guestName?, amount, status pending/paid, paidAt, collectedById?, clubId). @@index[bookingId], @@index[clubId, status]
- **PlayerRating**: Valoraciones post-partido (raterId, ratedId, openMatchId, stars 1-5, comment?, clubId). @@unique[raterId, ratedId, openMatchId], @@index[ratedId, clubId], @@index[openMatchId]
- **ChatMessage**: Chat de partida abierta (content VarChar(500), openMatchId, authorId, clubId). @@index[openMatchId, createdAt], @@index[clubId]
- **BookingWaitlist**: Lista de espera de reservas (courtId, userId, clubId, startTime, endTime, status active|notified|fulfilled|expired, notifiedAt?). @@unique[courtId, startTime, userId], @@index[courtId, startTime, status], @@index[clubId, userId]

## Auth y RBAC

- Session extiende con `id`, `clubId`, `clubName` y `role` (ver `src/types/next-auth.d.ts`)
- **requireAuth(permission)**: valida sesion + clubId + permiso en una llamada
- **isAuthError(result)**: type guard para verificar si es NextResponse de error
- **Middleware**: protege /dashboard (solo ADMIN_ROLES), permite /club/* publicamente, excluye /api/stripe/webhook, /api/contact, /api/blog/public, /api/auth/forgot-password, /api/auth/reset-password
- **Permisos**: definidos en `src/lib/permissions.ts`, ~49 permisos por 4 roles

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
- **SUPER_ADMIN / CLUB_ADMIN**: acceso total (incluye news:*, blog:*, analytics:read, billing:*, notifications:*, broadcast:*, recurring-bookings:*)
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

**Siguiente: D2, D5, E1**

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

**Sesion C1 - Tests criticos** `[x]`
- [x] 11 archivos de test, 155 tests pasando
- [x] Tests unitarios: requireAuth, pricing.ts, tokens.ts, csv.ts, email.ts, validation.ts, elo.ts, permissions.ts, utils.ts, rate-limit.ts, subscription.ts
- [x] Build exitoso

**Sesion C2 - Stripe Connect (pagos de reservas)** `[x]`
- [x] src/lib/stripe.ts: PLATFORM_FEE_PERCENT = 5
- [x] src/lib/subscription.ts: canUseOnlinePayments() (solo Pro/Enterprise)
- [x] APIs Connect: /api/stripe/connect/onboarding (POST), /api/stripe/connect/status (GET), /api/stripe/connect/dashboard (POST)
- [x] API checkout: /api/player/bookings/checkout (POST) - Stripe Checkout Session con application_fee_amount 5%
- [x] Webhook: checkout.session.completed para pagos de booking + charge.refunded para reembolsos
- [x] API player bookings: payAtClub param, paymentStatus logic, requiresPayment response, refund on cancel
- [x] API club/[slug]: expone bookingPaymentMode y stripeConnectOnboarded
- [x] API club PATCH: valida Connect onboarded + plan Pro+ para habilitar pagos online
- [x] StripeConnectCard.tsx: 4 estados (plan incompatible, sin cuenta, verificacion pendiente, activo)
- [x] ConfirmacionReserva.tsx: 3 modos de boton (presential, online, both) + manejo ?pago=exito/cancelado
- [x] GridReservas.tsx + reservar/page.tsx: pasan bookingPaymentMode y stripeConnectOnboarded
- [x] SettingsForm.tsx: deshabilita opciones online/both sin Connect
- [x] Cron booking-reminders: auto-cancelacion reservas sin pago en 15 min
- [x] i18n: seccion stripeConnect en es.json y en.json
- [x] Build exitoso

**Sesion C3 - Comunicacion masiva** `[x]`
- [x] Modelo Broadcast (title, message, channels, segment, recipientCount, status, sentBy, club)
- [x] src/lib/broadcast.ts: resolverSegmento(), enviarBroadcast() con batching (lotes 10)
- [x] src/lib/email.ts: enviarEmailBroadcast() con plantilla branded
- [x] API /api/broadcasts (GET historial, POST crear+enviar), /api/broadcasts/preview (GET count)
- [x] Rate limiting: 5 broadcasts/hora, requireSubscription: true
- [x] Segmentacion: todos, activos, inactivos, por nivel
- [x] Canales: push+in-app, email, o ambos
- [x] UI admin: /dashboard/comunicacion (historial), /dashboard/comunicacion/nuevo (formulario)
- [x] Preview de destinatarios antes de enviar con debounce
- [x] AlertDialog de confirmacion antes de envio
- [x] Permisos RBAC: broadcast:create, broadcast:read (solo SUPER_ADMIN, CLUB_ADMIN)
- [x] Navegacion: item "Comunicacion" en sidebar con icono Megaphone
- [x] i18n: seccion "broadcast" en es.json y en.json
- [x] Eliminado /api/notifications/broadcast (superseded)
- [x] Build exitoso

**Sesion C4 - Reservas recurrentes** `[x]`
- [x] Modelo RecurringBooking (dayOfWeek, startHour/Minute, endHour/Minute, isActive, startsAt, endsAt, courtId, userId, guestName, clubId)
- [x] Campo recurringBookingId en Booking (onDelete: SetNull)
- [x] 4 permisos RBAC: recurring-bookings:read/create/update/delete (admin + staff)
- [x] canCreateRecurringBooking(): Starter 0, Pro 10, Enterprise ilimitadas
- [x] API CRUD: /api/recurring-bookings (GET, POST), /api/recurring-bookings/[id] (GET, PATCH, DELETE)
- [x] Cron job: /api/cron/generate-recurring-bookings (lookahead 7 dias, idempotente, overlap detection, precio dinamico)
- [x] UI admin: /dashboard/reservas-recurrentes (lista con tabs, crear, editar, toggle activa/inactiva, eliminar)
- [x] Componentes: RecurringBookingForm (react-hook-form + zod), ReservasRecurrentesClient (patron NoticiasClient)
- [x] Navegacion: item "Clases Fijas" en sidebar con icono Repeat
- [x] i18n: seccion recurringBookings en es.json y en.json
- [x] Build exitoso

**Sesion C5 - i18n completo** `[x]`
- [x] Cookie-based locale switching (NEXT_LOCALE cookie, API /api/locale, middleware)
- [x] LanguageSelector.tsx: dropdown ES/EN en Navbar marketing, Header admin y ClubLayout
- [x] nav-items.ts refactorizado: name → nameKey, resuelto con t() en Sidebar/MobileNavBar/MobileSidebar
- [x] ~550 keys nuevas en messages/es.json y messages/en.json (~950 keys totales)
- [x] Marketing: 12 componentes migrados (Hero, Features, Pricing, Footer, Navbar, CTA, ContactForm, FAQ, HowItWorks, PainPoints, SocialProofBar, Testimonials)
- [x] Auth: AuthForm.tsx, AuthBrandingPanel.tsx (Zod schemas con useMemo + t())
- [x] Dashboard: DashboardClient, NoticiasClient, NewsForm, BlogListClient, BlogForm, SociosClient, BookingModal, AgendaDelDia
- [x] Club Portal: ClubHome, ClubLayout, ConfirmacionReserva, GridReservas, NuevaPartidaJugadorForm, Leaderboard
- [x] Layout: Header, GlobalSearch, NotificationBell migrados
- [x] Paginas publicas: sobre-nosotros, contacto migrados con getTranslations()
- [x] Locale-aware date/time: ~25 componentes actualizados (useLocale/getLocale → localeCode es-ES/en-GB)
- [x] Build exitoso, 155 tests pasando

**Sesion C6 - Pago por jugador en reservas y partidas abiertas** `[x]`
- [x] Modelo BookingPayment (bookingId, userId, guestName, amount, status, paidAt, collectedById, clubId)
- [x] Campo numPlayers en Booking (Int, default 4 - padel estandar 2v2)
- [x] Permisos RBAC: booking-payments:read (todos), booking-payments:update (admin + staff)
- [x] API GET /api/bookings/[bookingId]/player-payments (auto-genera si no existen)
- [x] API POST /api/bookings/[bookingId]/player-payments (regenerar con nuevo numPlayers)
- [x] API PATCH /api/bookings/[bookingId]/player-payments/[paymentId] (cobrar/deshacer individual)
- [x] Auto-sync: Booking.paymentStatus = "paid" cuando todos los BookingPayments estan "paid"
- [x] Integracion: BookingPayments creados al crear reserva jugador (fire-and-forget)
- [x] Integracion: BookingPayments creados al completar partida abierta (4 jugadores FULL)
- [x] Integracion: BookingPayments borrados al salir de partida abierta FULL
- [x] Integracion: BookingPayments marcados como paid al cobrar reserva completa
- [x] UI PendingPayments refactorizado: filas expandibles, desglose por jugador, cobro individual
- [x] UI PendingPayments: selector numPlayers (2/3/4), edicion nombres invitados, "Cobrar todo"
- [x] UI BookingModal: campo numPlayers en formulario de creacion admin
- [x] UI ConfirmacionReserva: precio por jugador informativo (4 jug. / 2 jug.)
- [x] i18n: seccion playerPayments en es.json y en.json
- [x] Build exitoso, 155 tests pasando

### BLOQUE D: PULIDO (post-lanzamiento)

**Sesion D1 - Accesibilidad WCAG 2.1 AA** `[x]`
- [x] SkipToContent.tsx: enlace "Saltar al contenido principal" (sr-only, visible al focus)
- [x] Skip-link + id="contenido-principal" en 3 layouts (public, dashboard, club portal)
- [x] Heading hierarchy: h1→span en Sidebar, Hero h1 unificado, main anidado→div en Dashboard
- [x] Nav landmarks: aria-label en 5 navs (Sidebar, MobileNavBar, ClubLayout x2, Navbar)
- [x] aria-current="page" en links activos de Sidebar, MobileNavBar y ClubLayout
- [x] Elementos interactivos: div/li onClick→button en CourtGridView (3), GridReservas (2), SociosClient
- [x] Formularios: aria-describedby + aria-invalid + aria-required + role="alert" en 9 archivos
- [x] Select labels: id en SelectTrigger + htmlFor en Label (BookingModal, EditCourtForm, BroadcastForm)
- [x] Inputs busqueda: sr-only labels en SociosClient y GlobalSearch
- [x] Icon buttons: aria-label en ~22 botones (15 back buttons + 7 componentes)
- [x] DialogTitle/Description: GlobalSearch (sr-only), BookingModal, SocioDetailModal, AddTeamModal
- [x] Table scope: scope="col" default en TableHead, scope="row" en CourtPricingForm, scope en 4 tablas raw
- [x] Navbar mobile: aria-expanded, aria-controls, aria-hidden en menu colapsable
- [x] Live regions: aria-live en NotificationBell (contador), AuthForm (fortaleza password), GlobalSearch (resultados)
- [x] Contraste CSS: --primary 60%→50% (light), --destructive 30.6%→50% (dark), text-white/40→/60
- [x] Touch targets 44px: Header avatar, NotificationBell, ThemeToggle, Footer social, ClubHome social
- [x] Alt text: avatares usan nombre del usuario en lugar de "Avatar" generico
- [x] Build exitoso
**Sesion D2** - E2E tests con Playwright `[ ]`

**Sesion D3 - Dashboard mejorado (revenue chart, agenda del dia)** `[x]`
- [x] IngresosSemana.tsx: BarChart apilado (recharts) ultimos 7 dias, barras cobrado (verde) + pendiente (ambar)
- [x] Stat card "Ingresos Hoy" reemplaza "Competiciones Activas" (icono Euro, formato moneda EUR)
- [x] Card "Resumen Financiero": ingresos del mes + pagos pendientes (count reservas)
- [x] Queries de ingresos en page.tsx: reservas 7d, aggregate mensual, count pendientes (Promise.all)
- [x] Layout dashboard 3 filas: stat cards | agenda + grafico ingresos | proximas reservas + resumen financiero
- [x] AgendaDelDia.tsx: i18n de 4 strings hardcodeados (titulo, invitado, partida abierta, sin reservas)
- [x] i18n: 12 keys nuevas en es.json y en.json (seccion dashboard)
- [x] Build exitoso, 155 tests pasando

**Sesion D4 - Social (chat, valoraciones, buscar jugadores)** `[x]`
- [x] Schema Prisma: PlayerRating (raterId, ratedId, openMatchId, stars 1-5, comment, clubId, @@unique), ChatMessage (content, openMatchId, authorId, clubId, @@index[openMatchId, createdAt])
- [x] PlayerStats: +averageRating Float?, +totalRatings Int (denormalizados para perfiles rapidos)
- [x] Relaciones: User.ratingsGiven/ratingsReceived/chatMessages, OpenMatch.chatMessages/ratings, Club.chatMessages/playerRatings
- [x] 5 permisos RBAC: players:read, chat:read/write, ratings:read/write (PLAYER + admin/staff)
- [x] TipoNotificacion: +player_rated (push si >= 4 estrellas)
- [x] API directorio: GET /api/club/[slug]/players (auth, filtros q/nivel/posicion, paginacion 12/pagina)
- [x] API perfil: GET /api/club/[slug]/players/[userId] (stats + valoraciones recientes + partidas recientes)
- [x] API ratings: GET /api/player/ratings/pending (partidas ultimos 7 dias sin valorar), POST /api/player/ratings (Zod, transaccion, recalcula promedio)
- [x] API chat: GET/POST /api/player/chat/[openMatchId] (polling incremental con ?since=, rate limit 10/min, solo participantes escriben)
- [x] Directorio jugadores: /club/[slug]/jugadores (JugadoresClient con busqueda debounce + filtros nivel/posicion + grid PlayerCards)
- [x] Perfil publico: /club/[slug]/jugadores/[userId] (avatar, stats grid, partidas recientes, valoraciones recientes)
- [x] Chat partidas: PartidaChat.tsx (Sheet slide-over, polling 10s, burbujas WhatsApp-style, auto-scroll)
- [x] Valoraciones: ValoracionesWidget.tsx en perfil (partidas pendientes, Dialog con EstrellasInput 1-5 + comentario)
- [x] EstrellasDisplay.tsx (readonly) + EstrellasInput.tsx (clickable con hover, aria-role radiogroup)
- [x] Leaderboard.tsx: nombres linkados a perfiles, nueva prop slug, podio cards clickables
- [x] Partidas page: nombres de jugadores como Links, boton Chat (MessageCircle) en partidas propias
- [x] ClubLayout.tsx: nav item "Jugadores" (Users2 icon) entre Rankings y Noticias
- [x] Solo miembros logueados del mismo club pueden ver perfiles (privacidad, no publico como rankings)
- [x] i18n: namespace social (~50 keys) en es.json y en.json + key players en namespace club
- [x] Build exitoso

**Sesion D5** - CI/CD (GitHub Actions: lint + test + build en PR) `[ ]`

### Orden recomendado
Sprint 1: A1, A2 [DONE] → Sprint 2: A3, A5 [DONE] → Sprint 3: A4, B1 [DONE] → Sprint 4: B4, B3 [DONE] → Sprint 5: B2 [DONE], B5 [DONE] → Sprint 6: C1, C3 [DONE] → Sprint 7: D1 [DONE] → Sprint 8: C2 [DONE] → Sprint 9: C4 [DONE] → Sprint 10: C5, C6 [DONE] → Sprint 11: D3 [DONE] → Sprint 12: D4 [DONE] → Sprint 13: E2 [DONE] → Beta launch → Sprint 14+: D2, D5, E1, E3

### BLOQUE E: COMPETITIVO (cerrar gaps vs Playtomic, TPC Matchpoint, Doinsport)

Analisis competitivo realizado contra: Playtomic (87% clubs Espana, B2B2C), TPC Matchpoint (1450 clubs, apps nativas), Doinsport (1000+ clubs Francia, POS completo).

**Sesion E1 - WhatsApp sharing** `[ ]` (Esfuerzo: S)
- Boton "Compartir" en reservas confirmadas y partidas abiertas
- Web Share API (`navigator.share()`) con fallback a clipboard
- Datos: nombre pista, fecha, hora, enlace al portal del club
- Sin cambios de backend — solo UI en ConfirmacionReserva, perfil/historial, tarjeta partida abierta
- Competidores con esto: TPC Matchpoint, Playtomic

**Sesion E2 - Lista de espera en reservas** `[x]` (Esfuerzo: S)
- [x] Modelo BookingWaitlist (courtId, userId, clubId, startTime, endTime, status active|notified|fulfilled|expired, notifiedAt)
- [x] Bug fix: overlap checks filtran reservas canceladas en 4 endpoints (player/bookings, bookings, bookings/[id], open-matches)
- [x] Permisos RBAC: booking-waitlist:create/delete (todos los roles)
- [x] src/lib/waitlist.ts: liberarSlotYNotificar() + limpiarWaitlistAlReservar() (funciones de dominio centralizadas)
- [x] Tipo notificacion waitlist_slot_available + email enviarEmailSlotLiberado (plantilla branded)
- [x] API: GET/POST /api/player/bookings/waitlist, DELETE /api/player/bookings/waitlist/[id]
- [x] Integracion: cancelacion jugador, eliminacion admin, auto-cancel cron → liberarSlotYNotificar
- [x] Integracion: reserva jugador, reserva admin, partida abierta → limpiarWaitlistAlReservar
- [x] Cache availability reducido de 60s a 15s
- [x] UI GridReservas: boton Bell/BellOff en slots ocupados (con estado loading, toggle)
- [x] UI Perfil: seccion "Mi lista de espera" con entradas activas/notificadas y boton cancelar
- [x] i18n: namespace waitlist en es.json y en.json
- [x] Build exitoso, 155 tests pasando

**Sesion E3 - Modificacion/reagendado de reserva** `[x]` (Esfuerzo: S)
- [x] API: PATCH /api/player/bookings/[bookingId]/reschedule (Zod, cancel+rebook atomico en $transaction)
- [x] Validaciones: slot disponible (excluyendo reserva actual), politica cancelacion, maxAdvanceBooking, pista valida
- [x] Integracion waitlist: liberarSlotYNotificar en slot original + limpiarWaitlistAlReservar en nuevo slot
- [x] BookingPayments regenerados para la nueva reserva
- [x] Tipo notificacion: booking_rescheduled + email enviarEmailReagendamientoReserva (horario anterior tachado)
- [x] UI: boton CalendarClock en perfil + Dialog con selector fecha, slots disponibles, seleccion visual
- [x] i18n: namespace reschedule en es.json y en.json
- [x] Build exitoso

