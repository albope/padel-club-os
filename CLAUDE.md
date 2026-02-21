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

## Estructura

```
src/
  app/
    (public)/       # Landing page marketing (layout con Navbar + Footer)
    api/            # API Routes (REST)
      auth/         # NextAuth handler
      bookings/     # CRUD reservas (admin)
      club/         # Ajustes club + API publica /club/[slug]
      competitions/ # CRUD competiciones, equipos, partidos
      courts/       # CRUD pistas
      open-matches/ # CRUD partidas abiertas (admin)
      player/       # APIs de jugador (bookings, open-matches, profile)
      register/     # Registro admin + /register/player
      users/        # CRUD socios + importacion
    club/[slug]/    # Portal publico del club (jugadores)
      login/        # Login jugador
      registro/     # Registro jugador
      reservar/     # Reservar pista
      partidas/     # Partidas abiertas (unirse/salir)
      competiciones/ # Ver competiciones (solo lectura)
      perfil/       # Perfil del jugador
    dashboard/      # Panel admin (layout con sidebar)
    login/          # Login admin
    register/       # Registro admin (crea club)
  components/
    ui/             # shadcn/ui (16 componentes)
    layout/         # Header, Sidebar, MobileNavBar, MobileSidebar, Breadcrumbs, ThemeToggle
    club/           # ClubLayout, ClubHome (portal jugadores)
    marketing/      # Hero, Features, Pricing, Testimonials, CTA, Navbar, Footer
    competitions/   # Ligas y torneos
    reservas/       # Reservas de pistas
    pistas/         # Gestion de pistas
    socios/         # Gestion de socios
    partidas-abiertas/ # Buscar partidas
    ajustes/        # Configuracion del club
    auth/           # AuthForm, AuthBrandingPanel
  lib/
    auth.ts         # Config de NextAuth (role en JWT/session)
    api-auth.ts     # requireAuth() helper con permisos RBAC
    permissions.ts  # Definicion de permisos por rol
    db.ts           # Prisma client singleton
    utils.ts        # cn() helper
    nav-items.ts    # Items de navegacion admin
  i18n/
    request.ts      # Config next-intl (locale fijo 'es')
  types/            # Tipos TS (next-auth.d.ts)
  hooks/            # Custom hooks (use-toast)
  middleware.ts     # Proteccion de rutas por rol
  test/             # Setup Vitest + utils
messages/
  es.json           # Traducciones espanol
  en.json           # Traducciones ingles
prisma/
  schema.prisma     # 10 modelos (ver seccion Modelos)
```

## Convenciones

- **Idioma**: Todo en espanol (variables, UI, comentarios, commits)
- **Componentes**: PascalCase, `'use client'` solo cuando hay hooks/formularios
- **API Routes**: Usar `requireAuth(permission)` de `@/lib/api-auth`, NUNCA getServerSession directo
- **Errores API**: `console.error("[CONTEXTO_ERROR]", error)` + try/catch
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

- **Club**: Centro multi-tenant. Config: description, phone, email, primaryColor, maxAdvanceBooking, cancellationHours, enableOpenMatches, enablePlayerBooking, bookingPaymentMode. Stripe: stripeSubscriptionId, subscriptionStatus, trialEndsAt, stripeConnectAccountId, stripeConnectOnboarded
- **User**: Pertenece a un Club, role (SUPER_ADMIN, CLUB_ADMIN, STAFF, PLAYER)
- **Court**: Pistas del club (name, type). Relacion: pricings (CourtPricing[])
- **Booking**: Reservas con solapamiento. Campos: cancelledAt, cancelReason, totalPrice, paymentStatus (pending|paid|exempt)
- **Payment**: Pagos (amount, currency, status, type booking|subscription, stripePaymentId unique, bookingId, userId, clubId)
- **CourtPricing**: Precios por pista/dia/hora (courtId, dayOfWeek 0-6, startHour, endHour, price, @@unique[courtId, dayOfWeek, startHour])
- **Competition**: Ligas/torneos (LEAGUE, KNOCKOUT, GROUP_AND_KNOCKOUT), status (ACTIVE, FINISHED)
- **Team**: 2 jugadores por equipo, stats (points, played, won, lost, sets, games)
- **Match**: Partidos de competicion (resultados formato "6-2 6-4")
- **OpenMatch**: Partidas abiertas por nivel (OPEN, FULL, CONFIRMED, CANCELLED)
- **OpenMatchPlayer**: Jugadores en partida abierta (tabla pivot)
- **News**: Noticias del club (title, content, published)

## Auth y RBAC

- Session extiende con `id`, `clubId` y `role` (ver `src/types/next-auth.d.ts`)
- **requireAuth(permission)**: valida sesion + clubId + permiso en una llamada
- **isAuthError(result)**: type guard para verificar si es NextResponse de error
- **Middleware**: protege /dashboard (solo ADMIN_ROLES), permite /club/* publicamente
- **Permisos**: definidos en `src/lib/permissions.ts`, ~30 permisos por 4 roles

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
- **SUPER_ADMIN / CLUB_ADMIN**: acceso total
- **STAFF**: gestionar reservas, pistas, competiciones; ver socios (no crear/editar/eliminar)
- **PLAYER**: crear reserva propia, unirse a partidas, ver competiciones, gestionar perfil

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
3. Pagos, notificaciones, reservas avanzadas
4. Rankings, social, analiticas
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

**Siguiente: Fase 3.2+ - Notificaciones, Reservas Avanzadas, PWA**

## Notas

- El postinstall ejecuta `prisma generate` automaticamente
- Variables de entorno: `DATABASE_URL`, `AUTH_SECRET` (en .env)
- Componentes shadcn se generan en `src/components/ui/`
- Node.js 20.16.0 - no soporta Prisma 7 (necesita 20.19+)
- Prisma generate puede fallar con EPERM si el dev server tiene el DLL bloqueado - parar dev server primero
- Para usar toast: `import { toast } from '@/hooks/use-toast'`
- Toast de error: `toast({ title: "Error", description: "...", variant: "destructive" })`
- Toast de exito: `toast({ title: "Exito", description: "...", variant: "success" })`
