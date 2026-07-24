# Padel Club OS

Plataforma SaaS para clubes de padel con dashboard de operacion, portal de jugador y capa de pagos, comunicacion y competicion sobre un unico producto multi-tenant.

## Estado actual

El producto incluye:

- dashboard para club con reservas, pistas, socios, noticias, blog, partidas abiertas, rankings y analiticas;
- portal de jugador con reservas, tarifas, noticias, competiciones, rankings, perfil y recuperacion de password;
- pagos SaaS con Stripe y pagos online de reservas;
- pagos por jugador, reservas recurrentes, recordatorios y waitlist;
- notificaciones push, email e in-app;
- auth con roles, permisos, RGPD, PWA e i18n.
- membresías multi-club, invitación de staff y aislamiento por tenant;
- centro de demos e impersonación de soporte en modo solo lectura;
- feedback de admin/jugador y bandeja de triaje;
- reembolsos durables, webhook idempotente y readiness operativo.

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 15 | App Router, web publica, dashboard y APIs |
| TypeScript 5 | Tipado |
| Prisma 6 + PostgreSQL | Modelo de datos y acceso a BD |
| NextAuth 4 | Auth con JWT + credentials |
| Tailwind + Radix/shadcn | UI |
| Stripe | Suscripciones SaaS y pagos online |
| Resend + web-push | Emails y push |
| next-intl | i18n ES/EN |
| Vitest | Testing |
| Sentry | Observabilidad basica |

## Arquitectura

```text
/                     landing publica
/login /register      auth de admins
/dashboard/*          panel del club
/club/[slug]/*        portal publico del club y area de jugador
/api/*                APIs REST del monolito
```

El sistema es multi-tenant por `clubId`. Los roles actuales son `SUPER_ADMIN`, `CLUB_ADMIN`, `STAFF` y `PLAYER`.

## Dominios principales

El schema actual ya cubre, entre otros:

- `Club`, `User`, `Court`, `Booking`
- `Competition`, `OpenMatch`, `PlayerStats`
- `Payment`, `BookingPayment`
- `Notification`, `Broadcast`
- `RecurringBooking`, `BookingWaitlist`
- `News`, `BlogPost`

La referencia real del modelo es `prisma/schema.prisma`.

## Estructura del repo

```text
src/
  app/
    (public)/          marketing
    api/               route handlers
    club/[slug]/       portal jugador
    dashboard/         panel admin
  components/          UI y modulos de negocio
  lib/                 auth, permisos, pricing, stripe, notifications, waitlist
prisma/
  schema.prisma
  migrations/
```

## Arranque local

### Requisitos

- Node.js 20.19+
- PostgreSQL

### Instalacion

```bash
npm install
cp .env.example .env
npx prisma migrate dev
npm run dev
```

Si necesitas datos de demo:

```bash
npx prisma db seed
```

## Variables de entorno

La fuente buena es `.env.example`. Como minimo necesitaras:

- `DATABASE_URL`
- `AUTH_SECRET`

### Base de datos de desarrollo (IMPORTANTE)

El `DATABASE_URL` del `.env` local debe apuntar a una base de datos de
DESARROLLO, nunca a la de produccion. Con Neon la forma recomendada es una
branch de la base principal:

1. Neon Console → proyecto → **Branches** → **Create branch** (nombre: `dev`,
   partiendo de `main`). La branch nace con una copia de los datos y es
   independiente: lo que toques ahi no afecta a produccion.
2. Copia el connection string de la branch `dev` al `DATABASE_URL` de tu `.env`.
3. La URL de produccion vive SOLO en las variables de entorno de Vercel.

Para scripts puntuales contra produccion (seeds de demos, etc.), pasa la URL
explicitamente en el comando y usa las guardas de los scripts (`--confirm`):

```powershell
$env:DATABASE_URL = "<url-produccion>"; npx tsx scripts/seed-demo-club.ts --confirm
```

Nota operativa: para crear demos comerciales no hace falta nada de esto — usa
el generador de `/dashboard/clubs` (SUPER_ADMIN), que corre en produccion con
sus propias guardas.

Segun lo que quieras probar tambien entran:

- Stripe
- Resend
- VAPID para push
- Sentry
- almacenamiento/subida de archivos

## Scripts actuales

| Comando | Descripcion |
|---|---|
| `npm run dev` | desarrollo |
| `npm run build` | build de produccion |
| `npm run start` | arrancar build |
| `npm run lint` | lint (eslint, --max-warnings 0) |
| `npm run typecheck` | tsc --noEmit |
| `npm test` | tests con Vitest |
| `npm run test:watch` | Vitest en watch |
| `npm run test:e2e` | flujo crítico real con Playwright |
| `npm run db:test-migrations` | reconstrucción de schema desde cero |
| `npm run production:preflight` | valida configuración de lanzamiento |
| `npm run release:verify` | auditoría, lint, tipos, tests, build y migraciones |

CI (GitHub Actions): lint + typecheck + test + build en cada push/PR a master.
Vercel despliega automaticamente los push a master.

## Documentacion del repo

- `docs/production-readiness.md`: auditoría, bloques y bloqueos externos.
- `docs/operacion.md`: despliegue, observabilidad, crons y recuperación.
- `FUNCIONAL.md`: foto corta del producto.
- `ROADMAP-90-DIAS-SWITCH-MATCHPOINT.md`: evolución posterior al piloto.

## Licencia

Proyecto privado.
