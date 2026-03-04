# Padel Club OS

Plataforma SaaS para clubes de padel con dashboard de operacion, portal de jugador y capa de pagos, comunicacion y competicion sobre un unico producto multi-tenant.

## Estado actual

Hoy el repo ya incluye:

- dashboard para club con reservas, pistas, socios, noticias, blog, partidas abiertas, rankings y analiticas;
- portal de jugador con reservas, tarifas, noticias, competiciones, rankings, perfil y recuperacion de password;
- pagos SaaS con Stripe y pagos online de reservas;
- pagos por jugador, reservas recurrentes, recordatorios y waitlist;
- notificaciones push, email e in-app;
- auth con roles, permisos, RGPD, PWA e i18n.

Los huecos mas claros a dia de hoy siguen siendo:

- `CI` y `typecheck` como checks formales;
- importacion/migracion mas robusta para switching;
- multi-admin con invitacion real de staff;
- horarios especiales, cierres y audit log;
- cierre fino del contrato de estados de pago.

## Stack

| Tecnologia | Uso |
|---|---|
| Next.js 14 | App Router, web publica, dashboard y APIs |
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

La referencia real del modelo es [schema.prisma](c:/Users/abort/Desktop/Projects/padel-club-os/prisma/schema.prisma).

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

- Node.js 20+
- PostgreSQL

### Instalacion

```bash
npm install
cp .env.example .env
npx prisma db push
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
| `npm run lint` | lint actual del proyecto |
| `npm test` | tests con Vitest |
| `npm run test:watch` | Vitest en watch |

Nota: el repo aun no tiene `typecheck` separado ni workflow de CI estable.

## Documentacion del repo

- [FUNCIONAL.md](c:/Users/abort/Desktop/Projects/padel-club-os/FUNCIONAL.md): foto corta del producto.
- [AUDITORIA-2-SEMANAS.md](c:/Users/abort/Desktop/Projects/padel-club-os/AUDITORIA-2-SEMANAS.md): deuda tecnica viva.
- [ROADMAP-90-DIAS-SWITCH-MATCHPOINT.md](c:/Users/abort/Desktop/Projects/padel-club-os/ROADMAP-90-DIAS-SWITCH-MATCHPOINT.md): roadmap realista a 90 dias.
- [MATERIAL-LANZAMIENTO.md](c:/Users/abort/Desktop/Projects/padel-club-os/MATERIAL-LANZAMIENTO.md): materiales pendientes para vender y operar mejor.

## Licencia

Proyecto privado.
