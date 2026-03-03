# Padel Club OS - Documento Funcional Completo

## Contexto
Mapa completo de todas las secciones, funcionalidades implementadas y oportunidades de mejora.
Sirve como hoja de ruta para saber que hay, que falta y que se puede mejorar.

---

## 1. LANDING PAGE / WEB PUBLICA (`/`)

### Secciones implementadas
| Seccion | Descripcion |
|---|---|
| **Hero** | Fondo oscuro con orbes animados, mockup del dashboard, 2 CTAs (Empieza gratis / Contacto) |
| **SocialProofBar** | Contadores animados: 50+ clubes, 12k+ reservas, 5k+ jugadores, 99.9% uptime |
| **PainPoints** | 3 problemas (WhatsApp, Excel, software rigido) con tarjetas antes/despues |
| **Features** | 8 funcionalidades en grid 4 columnas con animacion scroll |
| **HowItWorks** | 3 pasos (Crear / Configurar / Gestionar) con circulos numerados |
| **Pricing** | 3 planes (Starter 19€, Pro 49€, Enterprise 99€) con toggle mensual/anual + tabla comparativa |
| **FAQ** | 6 preguntas frecuentes con `<details>` nativo |
| **CTA final** | Seccion oscura con enlaces a registro y contacto |
| **Navbar** | Sticky, transparente en hero, hamburguesa movil. Links: Funcionalidades, Como funciona, Precios, Blog, Contacto |
| **Footer** | 4 columnas: marca + redes, Producto, Empresa, Legal |

### Paginas adicionales
| Pagina | URL | Estado |
|---|---|---|
| Sobre nosotros | `/sobre-nosotros` | Completa (equipo, principios, stats) |
| Contacto | `/contacto` | Completa (formulario + envio email con Resend + FAQ) |
| Blog | `/blog` | Completo (listado con post destacado + grid) |
| Blog detalle | `/blog/[slug]` | Completo (SEO con generateMetadata) |
| Cookies | `/cookies` | Completa (7 secciones, tabla de cookies) |
| Privacidad | `/privacidad` | Completa (10 secciones, derechos RGPD) |
| Terminos | `/terminos` | Completa (12 secciones) |
| Pagina 404 | cualquier ruta invalida | Completa (SVG padel, orbes animados, "¡Bola fuera!") |

### Banner de cookies RGPD
- CookieBanner.tsx: banner fijo inferior con icono cookie
- Dos opciones: "Solo esenciales" / "Aceptar todo"
- Persistencia via localStorage (`padel-cookie-consent`)
- Enlace a /cookies

### Posibles mejoras
- [ ] **Testimonios reales**: el componente Testimonials.tsx no muestra testimonios, muestra pain points duplicados
- [ ] **Capturas de pantalla / demos**: mostrar el producto real en vez de mockups genericos
- [ ] **Video demo**: añadir video del producto en uso
- [x] **Banner de cookies**: consentimiento RGPD implementado (CookieBanner.tsx)
- [ ] **Chat en vivo / widget de soporte**: alternativa al formulario de contacto
- [ ] **Casos de exito**: pagina dedicada con clubes reales usando la plataforma
- [ ] **Comparativa vs competencia**: pagina tipo "PadelOS vs Matchpoint"
- [x] **SEO mejorado**: robots.ts, sitemap.ts, generateMetadata en paginas publicas, JSON-LD Organization + SoftwareApplication
- [ ] **Animaciones mas suaves**: algunas transiciones son basicas

---

## 2. PANEL DE ADMINISTRACION (`/dashboard`)

### Navegacion (sidebar)
14 secciones en desktop, 4 accesos rapidos en movil (Inicio, Reservas, Socios, Pistas).

### Secciones y funcionalidades

#### 2.1 Dashboard Home (`/dashboard`)
- 4 tarjetas KPI: Reservas hoy, Socios activos, Ocupacion %, Ingresos hoy (EUR)
- Grafico de ingresos ultimos 7 dias (BarChart apilado: cobrado verde + pendiente ambar)
- Agenda del dia: timeline hora por hora con reservas agrupadas (partidas abiertas en verde)
- Card resumen financiero: ingresos del mes + pagos pendientes (count)
- Lista paginada de proximas reservas (5/pagina)
- Boton "Nueva Reserva" rapido + boton "Comunicacion" para broadcast

#### 2.2 Reservas (`/dashboard/reservas`)
- **Vista Calendario** (mensual) y **Vista Parrilla** (dia x pista)
- CRUD completo: crear, editar, eliminar reservas
- Deteccion de solapamientos
- Asignar a socio (autocompletado) o invitado por nombre
- Reservas admin = paymentStatus "exempt" (sin cobro)

#### 2.3 Pistas (`/dashboard/pistas`)
- CRUD: crear, editar, eliminar pistas (nombre + tipo: Cristal/Muro/Individual)
- **Precios dinamicos** por pista: grid dia x hora con precios por franja

#### 2.4 Competiciones (`/dashboard/competitions`)
- CRUD competiciones: Liga, Torneo eliminatorio, Grupos + Eliminatorias
- Gestion de equipos (2 jugadores por equipo)
- Generacion automatica de calendario (Berger tables para ligas)
- Entrada de resultados (formato "6-2 6-4")
- Exportar cuadro como imagen PNG
- Soporte 1 o 2 vueltas en ligas

#### 2.5 Socios (`/dashboard/socios`)
- Lista con busqueda y paginacion (10/pagina)
- Modal detalle con stats (reservas activas, total)
- CRUD: crear, editar, eliminar socios
- Importacion masiva CSV/TXT (salta duplicados)

#### 2.6 Partidas Abiertas (`/dashboard/partidas-abiertas`)
- Grid de tarjetas con estado (OPEN/FULL/CONFIRMED/CANCELLED)
- Crear: pista, fecha, hora, jugadores iniciales, rango nivel
- Editar, cancelar (elimina reserva provisional)
- Compartir por WhatsApp (mensaje prefabricado)

#### 2.7 Noticias (`/dashboard/noticias`)
- CRUD con filtros: Todas / Publicadas / Borradores
- Toggle publicar/despublicar con un clic
- Al publicar: envia notificacion push a jugadores del club

#### 2.8 Blog (`/dashboard/blog`)
- CRUD de articulos (nivel plataforma, no por club)
- Auto-generacion de slug desde titulo
- Campos: titulo, slug, contenido, extracto, categoria, imagen, autor, tiempo lectura
- Toggle publicar/despublicar

#### 2.9 Analiticas (`/dashboard/analiticas`)
- **StatsCards**: Total reservas, Socios, Pistas, Reservas mes (con tendencia %)
- **BookingTrends**: Grafico linea/barras ultimos 30 dias
- **MemberGrowth**: Grafico crecimiento socios 12 meses (simulado)
- **CourtUtilization**: Barras % utilizacion por pista (30 dias)
- **PeakHours**: Heatmap horas punta por dia de semana

#### 2.10 Facturacion (`/dashboard/facturacion`)
- Plan actual con badge de estado
- Historial de pagos (ultimos 10)
- Portal de Stripe (gestionar metodo pago, cancelar, facturas)
- Upgrade de plan via Stripe Checkout
- Banner persistente en todo el dashboard para trial/past_due/canceled

#### 2.11 Ajustes (`/dashboard/ajustes`)
- **Info club**: nombre, descripcion, telefono, email, horarios
- **Apariencia portal**: color primario, banner (upload), Instagram, Facebook
- **Reservas**: dias anticipacion, horas cancelacion, habilitar reservas, habilitar partidas, duracion reserva (60/90/120min), modo pago (presencial/online/ambos)

#### 2.12 Rankings (`/dashboard/rankings`)
- Tabla de jugadores con stats ELO completas
- Posicion, rating, partidos jugados/ganados, rachas, win rate
- Sistema ELO para padel dobles (K-factor dinamico, rating base 1500)
- Conversion ELO a nivel padel (1.0 - 7.0)

#### 2.13 Comunicacion Masiva (`/dashboard/comunicacion`)
- Historial de envios (titulo, segmento, canales, destinatarios, estado)
- Nuevo envio: titulo, mensaje, canales (push/email/ambos), segmento (todos/activos/inactivos/nivel)
- Preview de destinatarios antes de enviar
- Rate limiting: 5 broadcasts/hora
- Permisos: solo SUPER_ADMIN y CLUB_ADMIN

#### 2.14 Clases Fijas (`/dashboard/reservas-recurrentes`)
- CRUD de reservas recurrentes (dia semana, hora, pista, socio/invitado, rango fechas)
- Tabs: Todas / Activas / Inactivas
- Toggle activar/desactivar con un clic
- Cron job diario genera reservas automaticamente (lookahead 7 dias)
- Deteccion de conflictos: salta slots ya ocupados
- Gating por plan: Starter no puede, Pro hasta 10, Enterprise ilimitadas

#### 2.15 Configuracion Inicial (`/dashboard/configuracion-inicial`)
- Wizard 4 pasos post-registro: info club, crear pistas, configurar precios, resumen
- OnboardingChecklist en dashboard home (5 pasos, barra progreso)
- Empty states mejorados en 6 paginas

### Componentes transversales del dashboard
- Sidebar + Header con breadcrumbs + toggle tema + dropdown usuario
- NotificationBell (campana con badge de no leidas, popover con lista)
- PushNotificationPrompt (banner para activar push, se oculta si descarta)
- SubscriptionBanner (aviso trial/pago pendiente/cancelado)
- GlobalSearch (Ctrl+K / Cmd+K: busca socios, pistas, reservas con debounce y navegacion teclado)
- MobileNavBar + MobileSidebar

### Posibles mejoras admin
- [x] **Dashboard mejorado**: grafico ingresos 7 dias, stat card revenue, resumen financiero, agenda del dia i18n
- [x] **Busqueda global**: GlobalSearch.tsx (Ctrl+K, busca socios/pistas/reservas, debounce 300ms)
- [x] **Exportar datos**: CSV para reservas (/api/bookings/export), socios (/api/users/export), pagos (/api/payments/export)
- [ ] **Historial de actividad / audit log**: quien hizo que y cuando
- [ ] **Multi-admin**: invitar mas administradores al club
- [x] **Gestion de pagos de pistas**: pago por jugador, cobro individual, PendingPayments refactorizado (C6)
- [x] **Comunicacion masiva**: /dashboard/comunicacion (email/push a socios, segmentacion por nivel/actividad)
- [x] **Reservas recurrentes**: /dashboard/reservas-recurrentes (clases fijas, cron semanal, gating por plan)
- [x] **Agenda del dia**: timeline hora por hora en dashboard home (i18n ES/EN)
- [ ] **Socios**: añadir foto de perfil, notas internas, estado activo/inactivo
- [x] **Rankings ELO**: /dashboard/rankings con tabla completa de stats
- [ ] **Analiticas**: revenue chart, comparativa periodos, exportar PDF
- [ ] **Configurar horarios especiales**: festivos, mantenimiento de pistas

---

## 3. PORTAL DEL JUGADOR (`/club/[slug]`)

### Navegacion
Desktop: barra horizontal con todos los items. Movil: bottom nav con los primeros 5 items + auth.
Items condicionales segun config del club (enablePlayerBooking, enableOpenMatches).

| Seccion | Condicion | Auth requerida |
|---|---|---|
| Inicio | Siempre | No |
| Reservar | `enablePlayerBooking` | Si (para confirmar) |
| Partidas | `enableOpenMatches` | Si (para interactuar) |
| Competiciones | Siempre | No |
| Rankings | Siempre | No |
| Noticias | Siempre | No |
| Tarifas | Siempre | No |
| Perfil | Siempre (solo logueado) | Si |

### Secciones y funcionalidades

#### 3.1 Inicio (`/club/[slug]`)
- Hero con banner del club (si tiene) o heading simple
- Tarjetas de accion rapida (Reservar, Partidas, Competiciones)
- Preview: 3 proximas partidas abiertas, 5 competiciones activas, 3 noticias recientes
- Info del club: horarios, direccion, telefono, email, redes sociales

#### 3.2 Reservar (`/club/[slug]/reservar`)
- **Grid visual estilo Matchpoint**: filas de 30min, columnas por pista
- Colores: blanco=libre, rojo=ocupado, azul=mi reserva, verde=partida abierta
- Precio mostrado por slot en celdas libres
- Navegacion por dias (anterior/siguiente + "Hoy")
- Click en slot libre → Sheet de confirmacion (pista, fecha, hora, precio, boton confirmar)
- Click en bloque verde → navega a Partidas

#### 3.3 Partidas Abiertas (`/club/[slug]/partidas`)
- Lista de partidas con tarjetas (pista, fecha, hora, nivel, jugadores, plazas libres)
- **Filtros**: fecha (todas/hoy/semana/dia concreto), pista, disponibilidad, nivel
- **Acciones**: Unirme (valida nivel), Salir, Crear nueva partida (formulario en dialog)
- Paginacion: 6 por pagina
- Al crear partida: auto-inscribe al creador + crea reserva provisional

#### 3.4 Competiciones (`/club/[slug]/competiciones`)
- Listado de competiciones activas y finalizadas (solo lectura)
- Detalle: tabla de clasificacion (PJ, PG, PP, SF, SC, Pts) + partidos por ronda

#### 3.5 Noticias (`/club/[slug]/noticias`)
- Listado de noticias publicadas (imagen, titulo, preview, fecha)
- Detalle con imagen header, fecha formateada, contenido completo

#### 3.6 Tarifas (`/club/[slug]/tarifas`)
- Precios agrupados por franjas horarias (mananas, mediodia, tardes-noche)
- Separado en L-V y fines de semana
- Pistas con precios identicos se agrupan

#### 3.7 Perfil (`/club/[slug]/perfil`)
- Editar: nombre, telefono, nivel, posicion preferida (email solo lectura)
- Historial de reservas (hasta 20, mas recientes primero)
- Cancelar reservas futuras (respeta ventana de cancelacion del club)
- Cerrar sesion

#### 3.8 Rankings (`/club/[slug]/rankings`)
- Leaderboard con tabs: Ranking, Mis stats, Info ELO
- Tabla de clasificacion con medallas top 3
- Stats personales: rating, partidos, rachas, win rate %
- Pestaña informativa explicando el sistema ELO

#### 3.9 Login / Registro / Recuperar contraseña
- Login: email + password, redirect al portal del club
- Registro: nombre, email, telefono, password con indicador de fuerza
- Recuperar contraseña: /club/[slug]/forgot-password (email con token de reset, 1h expiracion)

### Posibles mejoras portal jugador
- [x] **Pago online de reservas**: Stripe Connect con 5% comision, checkout, refunds (C2)
- [ ] **Perfil con foto**: subir avatar
- [ ] **Historial de partidas**: ver partidas abiertas en las que participo
- [ ] **Chat entre jugadores**: mensajeria dentro de una partida
- [ ] **Valoraciones post-partido**: puntuar compañeros
- [ ] **Buscar jugadores**: encontrar jugadores por nivel para crear partidas
- [ ] **Mis competiciones**: ver solo las competiciones donde participo
- [x] **Recordatorios**: cron job envia push + email 1h antes de reserva (/api/cron/booking-reminders)
- [ ] **Repetir reserva**: re-reservar mismo slot la semana siguiente
- [ ] **Invitar amigos al club**: generar link de invitacion
- [x] **Recuperar password**: flujo completo con email, token seguro SHA-256 y pagina de reset
- [ ] **Notificaciones de competiciones**: resultados, proximos partidos

---

## 4. PWA (Progressive Web App)

### Estado: IMPLEMENTADA (deshabilitada en desarrollo)

| Componente | Estado |
|---|---|
| `manifest.ts` | Completo: nombre, iconos, standalone, portrait |
| `sw.ts` (Service Worker) | Completo: Serwist, precaching, push events, notification click |
| `next.config.mjs` | Configurado con `withSerwistInit`, deshabilitado en dev |
| `layout.tsx` | Meta tags Apple WebApp, viewport, theme-color |
| Iconos | 6 iconos: 192, 512, maskable, apple-touch, SVG |

### Funcionalidad PWA
- Instalable como app nativa (Android + iOS)
- Cache offline de assets estaticos
- Recepcion de push notifications
- Click en notificacion abre la URL correcta

### Posibles mejoras PWA
- [ ] **Modo offline**: mostrar mensaje amigable sin conexion en vez de error
- [ ] **Cache de datos**: guardar ultima vista de reservas/partidas para acceso offline
- [ ] **Splash screen personalizado**: pantalla de carga con logo del club
- [ ] **Instalacion guiada**: banner "Instala la app" con instrucciones por plataforma
- [ ] **Badge en icono**: mostrar numero de notificaciones sin leer en el icono de la app
- [ ] **Testear en produccion**: verificar flujo completo (la SW esta deshabilitada en dev)

---

## 5. SISTEMA DE NOTIFICACIONES

### Estado: COMPLETA (push + email)

| Componente | Estado |
|---|---|
| Modelo `Notification` (BD) | Implementado |
| Modelo `PushSubscription` (BD) | Implementado |
| `web-push.ts` (envio push) | Implementado |
| `notifications.ts` (crear + broadcast) | Implementado |
| API CRUD notificaciones | Implementado (GET, PATCH, DELETE) |
| API suscripcion push | Implementado (POST, DELETE) |
| API VAPID key | Implementado |
| `NotificationBell` (UI campana) | Implementado (popover, polling 30s, badge) |
| `PushNotificationPrompt` (banner) | Implementado (con descarte localStorage) |
| Hook `use-push-notifications` | Implementado |
| Permisos RBAC | Todos los roles tienen acceso |

### Tipos de notificacion definidos
- `booking_confirmed` - Reserva confirmada
- `booking_cancelled` - Reserva cancelada
- `booking_reminder` - Recordatorio de reserva (push + email 1h antes via cron)
- `open_match_created` - Nueva partida abierta
- `open_match_full` - Partida completa
- `open_match_joined` - Alguien se unio a tu partida
- `news_published` - Nueva noticia publicada
- `competition_result` - Resultado de competicion (NO implementado el trigger)

### Donde se envian notificaciones actualmente
- **Noticias**: al publicar una noticia, se llama `notificarClub()` (push a todos los jugadores)
- **Reserva jugador**: `crearNotificacion()` con tipo `booking_confirmed` + email confirmacion
- **Cancelacion jugador**: `crearNotificacion()` con tipo `booking_cancelled` + email cancelacion
- **Recordatorio reserva**: cron push 1h antes + email recordatorio (`/api/cron/booking-reminders`)
- **Partida abierta creada**: `notificarClub()` a todos los jugadores del club
- **Unirse a partida**: `crearNotificacion()` al creador de la partida
- **Partida llena**: notificacion a todos los jugadores de la partida
- **Registro admin**: email de bienvenida con info trial y primeros pasos
- **Registro jugador**: email de bienvenida con acciones disponibles del club

### Emails transaccionales (src/lib/email.ts)
- Plantilla HTML branded: header gradiente azul/cyan con logo SVG, footer legal, boton CTA
- 7 emails: bienvenida admin, bienvenida jugador, confirmacion reserva, cancelacion reserva, recordatorio reserva, reset password, contacto
- Helpers: escaparHtml (XSS), cajaDetalle (ficha datos), formatearFecha/Hora
- Todos fire-and-forget (.catch), nunca bloquean APIs
- From: `Padel Club OS <onboarding@resend.dev>` (constante EMAIL_FROM)

### Pendiente por integrar
- [ ] **Resultado competicion**: notificar al introducir resultados
- [ ] **Variables de entorno**: configurar VAPID keys y RESEND_API_KEY en produccion

---

## 6. AUTH Y SEGURIDAD

### Implementado
- NextAuth v4 con Credentials provider + JWT
- 4 roles: SUPER_ADMIN, CLUB_ADMIN, STAFF, PLAYER
- ~41 permisos definidos, verificados en cada API route
- Middleware protege /dashboard (solo admin roles), redirige a /facturacion si suscripcion inactiva
- Registro admin (crea club con trial 14 dias) + email bienvenida
- Registro jugador (requiere slug de club valido, verifica suscripcion + limites) + email bienvenida
- Session incluye: id, clubId, clubName, role, subscriptionStatus, trialEndsAt
- Rate limiting centralizado (src/lib/rate-limit.ts): contacto, forgot/reset-password, register admin/player
- Recuperacion de contraseña: tokens SHA-256, un solo uso, expiran en 1h, email branded
- Flujo reset password para admin (/forgot-password, /reset-password) y jugadores (/club/[slug]/forgot-password)
- Banner de cookies RGPD con consentimiento real (bloquea scripts no esenciales)
- RGPD: /api/player/data-export (portabilidad), /api/player/data-delete (olvido), /api/consent (log consentimiento)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Enforcement suscripcion Stripe: gating por plan (courts, members), SubscriptionGate.tsx
- Logger estructurado: src/lib/logger.ts (JSON en prod, legible en dev, reporta a Sentry)
- Sentry SDK: error tracking automatico en server/edge/client con onRequestError
- .env.example: 17 variables de entorno documentadas

### Posibles mejoras
- [x] **Recuperar contraseña**: flujo email con token de reset (admin + jugador)
- [ ] **2FA**: autenticacion de dos factores
- [ ] **OAuth**: login con Google/Apple
- [ ] **Bloqueo por intentos**: bloquear cuenta tras X intentos fallidos
- [ ] **Logs de acceso**: registrar logins exitosos y fallidos
- [ ] **Sesiones activas**: ver y cerrar sesiones desde perfil

---

## 7. RESUMEN ESTADO POR FASE

| Fase | Nombre | Estado |
|---|---|---|
| 1 | Fundacion (design system, mobile, UX) | COMPLETADA |
| 2 | Portal publico + RBAC | COMPLETADA |
| 3.1 | Stripe + Precios dinamicos | COMPLETADA |
| 3.2 | Noticias + Analiticas + Marketing + Blog | COMPLETADA |
| 3.3 | Notificaciones push + PWA | COMPLETADA |
| 4 | Rankings ELO, seguridad, mejoras admin | COMPLETADA |
| Roadmap A | Critico (Stripe enforcement, seguridad, SEO, RGPD, error boundaries) | COMPLETADA |
| Roadmap B | Importante (emails, validacion APIs, onboarding, monitoring, performance) | COMPLETADA |
| Roadmap C1 | Tests criticos (155 tests, 11 archivos) | COMPLETADA |
| Roadmap C2 | Stripe Connect (pagos reservas online, 5% comision) | COMPLETADA |
| Roadmap C3 | Comunicacion masiva (email/push, segmentacion) | COMPLETADA |
| Roadmap C4 | Reservas recurrentes (clases fijas semanales, cron) | COMPLETADA |
| Roadmap D1 | Accesibilidad WCAG 2.1 AA | COMPLETADA |
| Roadmap C5 | i18n completo (cookie locale, LanguageSelector, ~950 keys) | COMPLETADA |
| Roadmap C6 | Pago por jugador en reservas y partidas abiertas | COMPLETADA |
| Roadmap D3 | Dashboard mejorado (revenue chart, agenda del dia) | COMPLETADA |
| 5 | Crecimiento (multi-deporte, API, white-label) | NO INICIADA |

---

## 8. TOP PRIORIDADES SUGERIDAS (hoja de ruta)

### Completado recientemente
- [x] **Enforcement suscripcion Stripe** - Middleware, API routes, gating por plan (A1)
- [x] **Cabeceras de seguridad** - CSP, HSTS, rate limiting centralizado (A2)
- [x] **SEO basico** - robots, sitemap, OG, JSON-LD, generateMetadata (A3)
- [x] **Compliance RGPD real** - Data export/delete, consent logging, script blocking (A4)
- [x] **Error boundaries + health check** - error.tsx, loading.tsx, /api/health (A5)
- [x] **Emails transaccionales** - 7 emails branded: bienvenida, reservas, reset, contacto (B1)
- [x] **Logger estructurado** - JSON prod, legible dev, integrado en APIs criticas (B4 parcial)

### Completado (rumbo a beta)
1. [x] **Onboarding admin** (B3) - Wizard post-registro, checklist, estados vacios
2. [x] **Validacion completa APIs** (B2) - Zod schemas en todas las rutas
3. [x] **Performance basica** (B5) - next/image, @@index Prisma, cache datos publicos
4. [x] **Tests criticos** (C1) - 155 unit tests (auth, pricing, tokens, CSV, etc.)
5. [x] **Stripe Connect** (C2) - Pagos de reservas online, 5% comision plataforma
6. [x] **Comunicacion masiva** (C3) - Email/push a socios, segmentacion por nivel/actividad
7. [x] **Reservas recurrentes** (C4) - Clases fijas semanales, cron job
8. [x] **i18n completo** (C5) - Cookie locale, LanguageSelector, ~950 keys ES/EN
9. [x] **Pago por jugador** (C6) - BookingPayment, cobro individual, sync paymentStatus
10. [x] **Dashboard mejorado** (D3) - Revenue chart 7 dias, resumen financiero, agenda i18n

### Pendiente (pulido post-lanzamiento)
11. [ ] **E2E tests** (D2) - Playwright, flujos criticos
12. [ ] **Social** (D4) - Chat jugadores, valoraciones, buscar jugadores
13. [ ] **CI/CD** (D5) - GitHub Actions: lint + test + build en PR

### Largo plazo (crecimiento)
14. **Multi-deporte** - Extender a tenis, futbol sala, etc.
15. **API publica** - Para integraciones terceros
16. **White-label** - Dominio personalizado por club
17. **Real-time** - Websockets para actualizaciones en vivo
