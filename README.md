# Padel Club OS

Plataforma SaaS de gestión integral para clubes de pádel en España. Reservas, socios, competiciones, pagos y portal para jugadores en una sola aplicación web moderna.

## Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| Next.js | 14.2.5 | Framework (App Router) |
| TypeScript | 5 | Lenguaje |
| Prisma | 6.19 | ORM (PostgreSQL) |
| NextAuth | 4 | Autenticación (JWT + Credentials) |
| Tailwind CSS | 3.4 | Estilos |
| shadcn/ui | - | Componentes UI (Radix UI) |
| next-themes | - | Tema light/dark |
| next-intl | - | Internacionalización (es/en) |
| Vitest | 2 | Testing |

## Arquitectura

```
Monolito Next.js con route groups:

/                    → Landing page pública (marketing)
/login, /register    → Autenticación de admins
/dashboard/*         → Panel de administración del club
/club/[slug]/*       → Portal público para jugadores
```

**Multi-tenant:** Cada club tiene un `clubId` que filtra todos los datos. Los clubes se identifican por `slug` único.

**Roles (RBAC):**
- `SUPER_ADMIN` - Acceso total a la plataforma
- `CLUB_ADMIN` - Gestión completa de su club
- `STAFF` - Gestión de reservas, pistas y competiciones
- `PLAYER` - Reservar pistas, unirse a partidas, ver competiciones

## Estructura del proyecto

```
src/
  app/
    (public)/           # Landing page de marketing
    api/                # API Routes REST
    club/[slug]/        # Portal público del club (jugadores)
    dashboard/          # Panel de administración
    login/, register/   # Autenticación
  components/
    ui/                 # shadcn/ui (button, card, dialog, toast, etc.)
    layout/             # Header, Sidebar, MobileNavBar, Breadcrumbs
    marketing/          # Hero, Features, Pricing, Testimonials, Footer, Navbar
    club/               # ClubLayout, ClubHome
    competitions/       # Ligas y torneos
    reservas/           # Reservas de pistas
    pistas/             # Gestión de pistas
    socios/             # Gestión de socios
    partidas-abiertas/  # Partidas abiertas
    ajustes/            # Configuración del club
  lib/
    auth.ts             # Configuración NextAuth
    db.ts               # Prisma client singleton
    utils.ts            # cn() helper
    permissions.ts      # Permisos por rol
    api-auth.ts         # Helper requireRole() para APIs
    nav-items.ts        # Ítems de navegación
  middleware.ts         # Protección de rutas por rol
  hooks/                # Custom hooks (use-toast)
  test/                 # Setup de testing
prisma/
  schema.prisma         # 12 modelos
```

## Modelos de datos

`Club` > `User` (con roles) > `Court` > `Booking` > `Competition` > `Team` > `Match` > `OpenMatch` > `News`

## Primeros pasos

### Requisitos

- Node.js >= 20.16
- PostgreSQL

### Instalación

```bash
# Clonar e instalar dependencias
git clone https://github.com/albope/padel-club-os.git
cd padel-club-os
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu DATABASE_URL y AUTH_SECRET

# Sincronizar base de datos
npx prisma db push

# Iniciar en desarrollo
npm run dev
```

### Variables de entorno

```env
DATABASE_URL="postgresql://user:password@localhost:5432/padel_club_os"
AUTH_SECRET="tu-secreto-aqui"
```

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (puerto 3000) |
| `npm run build` | Build de producción |
| `npm run lint` | ESLint |
| `npm test` | Ejecutar tests (Vitest) |
| `npm run test:watch` | Tests en modo watch |
| `npx prisma studio` | Explorar base de datos |
| `npx prisma db push` | Sincronizar schema con BD |

## Planes y precios

| Plan | Precio | Pistas | Socios | Admins |
|---|---|---|---|---|
| **Starter** | 19 EUR/mes | Hasta 4 | Hasta 50 | 1 |
| **Pro** | 49 EUR/mes | Ilimitadas | Hasta 500 | 3 |
| **Enterprise** | 99 EUR/mes | Ilimitadas | Ilimitados | Ilimitados |

## Roadmap

### Fase 1: Fundación - COMPLETADA
- [x] Design system con shadcn/ui (15+ componentes)
- [x] Tema light/dark con next-themes
- [x] Navegación móvil (sidebar + bottom nav)
- [x] Breadcrumbs automáticos
- [x] Error boundaries y loading skeletons
- [x] Migración completa al design system
- [x] Toast y AlertDialog (reemplazan alert/confirm)
- [x] Schema: roles de usuario (RBAC) + slug único por club
- [x] Auth: role en JWT/session
- [x] Testing con Vitest 2

### Fase 2: Portal público + RBAC - EN CURSO
- [x] RBAC (middleware, permisos por rol)
- [x] Landing page de marketing (hero, features, pricing, testimonios)
- [x] Portal del club: estructura base (`/club/[slug]`)
- [x] APIs para jugadores (reservas, partidas, perfil)
- [x] Autenticación de jugadores (login/registro por club)
- [ ] i18n completo en páginas públicas
- [ ] Pulir portal del club (UX de jugador)

### Fase 3: Pagos, notificaciones, reservas avanzadas
- [ ] Integración Stripe (suscripciones SaaS + pagos de pistas)
- [ ] Notificaciones (email con Resend, push, in-app)
- [ ] Reservas avanzadas (precios dinámicos, recurrentes, lista de espera)
- [ ] PWA (Progressive Web App)

### Fase 4: Rankings, social, analíticas
- [ ] Sistema de rankings ELO
- [ ] Dashboard de analíticas (recharts)
- [ ] Noticias del club (editor rich text)
- [ ] Perfiles públicos de jugadores

### Fase 5: Crecimiento y diferenciación
- [ ] Soporte multi-deporte (tenis, pickleball, squash)
- [ ] API pública versionada con API keys
- [ ] White-label (Enterprise)
- [ ] Funcionalidades real-time

## Licencia

Proyecto privado. Todos los derechos reservados.
