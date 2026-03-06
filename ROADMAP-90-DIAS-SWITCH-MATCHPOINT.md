# Roadmap 90 Dias

Fecha de referencia: 2026-03-05
Ultima actualizacion: 2026-03-06

## Punto de partida real
El producto ya no esta en fase cero. Hoy el workspace ya cubre:

- dashboard multi-tenant para club,
- portal jugador con reservas, partidas, rankings, noticias y perfil,
- pricing configurable por pista y duracion,
- pagos SaaS con Stripe y pagos online de reservas,
- pagos por jugador, recurrentes, recordatorios y waitlist,
- competiciones, rankings ELO, analiticas y notificaciones,
- base de seguridad, RGPD, PWA e i18n,
- CI/CD (lint + typecheck + test + build en PR),
- rate limit distribuido (Upstash Redis con fallback local),
- 467 tests (unitarios + integracion), 0 errores TS.

El roadmap de 90 dias debe partir de esta base y no rehacer trabajo ya hecho.

## Tesis
- Foco principal: switch desde Matchpoint u otro software similar.
- Foco secundario: entrada simple para clubes que siguen con WhatsApp, Excel o gestion manual.
- Regla: un solo producto, dos narrativas comerciales.

## Objetivo del periodo
Llegar a pilotos reales con una historia creible de migracion, operativa diaria estable y una UX de jugador claramente mejor que la alternativa legacy.

## Cerrado (ya implementado)
- CI y comandos de calidad (lint, typecheck, test, build, GitHub Actions).
- Importacion segura de socios (mustResetPassword, activacion por email, sin password por defecto).
- Contrato de estados de pago (BookingPayment, transiciones, 17 tests integracion).
- Rate limit distribuido (Upstash Redis, fallback local, fail-open con logging).
- Consistencia multi-tenant en reservas, disponibilidad y open matches.
- Observabilidad Sentry con logger estructurado.
- Importacion masiva de pistas con pricing desde CSV (API + UI + 31 tests, dedup case-insensitive, transaccion atomica, limites de plan).
- Importacion masiva de reservas futuras (API + UI + tests, parsing fecha DD/MM/YYYY y YYYY-MM-DD, dedup intra-CSV, precio dinamico).
- Wizard de migracion en /dashboard/migracion (4 pasos: config club, pistas, socios, reservas).
- Material comercial: landing /cambiar-desde-matchpoint, comparativa /comparativa/matchpoint, pagina demo con lead capture + email transaccional.
- Cache en auth JWT (subscriptionStatus y trialEndsAt en token, refresco controlado).

## Pendientes activos

### Bloque 1: Migracion (0-30 dias) — COMPLETADO

Todo el bloque de migracion esta cerrado. Las 4 tareas originales estan resueltas:
- Dataset migracion: cubierto por el wizard de 4 pasos (config + pistas + socios + reservas).
- Importacion pistas: API /api/courts/import + ImportPistasClient.
- Importacion reservas: API /api/bookings/import + ImportReservasClient.
- Material comercial: landing switch, comparativa, demo con lead capture.

### Bloque 2: Operativa diaria (31-60 dias)

| Tarea | Descripcion | Esfuerzo |
|-------|-------------|----------|
| Multi-admin con invitacion | Flujo invitar admin/staff por email, limites por plan | M |
| Horarios especiales y bloqueos | Modelo + UI para cierres temporales, festivos, mantenimiento pistas | M |
| Audit log basico | Registro de acciones criticas (crear/cancelar reserva, modificar config, importar) | M |

### Bloque 3: Diferenciacion jugador (61-90 dias)

| Tarea | Descripcion | Esfuerzo |
|-------|-------------|----------|
| Repetir reserva | Boton "reservar igual" en historial (misma pista, hora, dia semana) | S |
| Pulido UX portal jugador | Mejoras de flujo, micro-interacciones, branding por club | M |

## Indicadores a mirar cada 2 semanas
- Demos de switch realizadas.
- Pilotos activos.
- Tiempo hasta tener un club demo operativo.
- Blockers repetidos en recepcion.
- Tiempo hasta primera reserva util del jugador.
- Incidencias criticas abiertas durante piloto.

## No objetivos de este ciclo
- Multi-deporte completo.
- App nativa white-label.
- Hardware de accesos y luces.
- Rehacer el producto como si aun no existiera base operativa.

## Criterio de poda
Si una linea ya esta resuelta en producto, sale del roadmap. Este documento debe servir para decidir que viene, no para recordar todo lo que ya se hizo.
