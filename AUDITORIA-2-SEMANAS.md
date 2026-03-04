# Auditoria Tecnica Viva

Fecha de referencia: 2026-03-04

## Objetivo
Este documento ya no es un backlog historico. Solo recoge lo que sigue abierto y merece foco tecnico inmediato.

## Cerrado o suficientemente encaminado
- Privacidad de disponibilidad publica: la respuesta actual ya no expone `userId` ni listas de jugadores; solo devuelve bloques funcionales y `esPropia` cuando hay sesion.
- Hardening multi-tenant en reservas admin: validaciones de pista y reserva por club ya estan incorporadas.
- Pricing por duracion y cruce de franjas: `src/lib/pricing.ts` ya calcula por solape de bandas horarias.
- Creacion de open matches: ya valida duplicados, pertenencia al club y usa `bookingDuration` del club.
- Waitlist, pagos por jugador, recordatorios, rankings, recurrentes y notificaciones ya forman parte del producto base y salen de esta auditoria.

## Pendientes activos

| Severidad | Tema | Estado actual | Siguiente paso |
|---|---|---|---|
| SEV-1 | Tooling y CI | `package.json` sigue con `next lint`, no hay `typecheck` y no hay workflow de PR. | Cerrar `lint`, `typecheck`, `build` y `test` como checks no interactivos. |
| SEV-1 | Importacion segura de socios | `src/app/api/users/import/route.ts` sigue generando password por defecto `padel123`. | Sustituir por activacion segura o reset obligatorio y revisar la politica de duplicados. |
| SEV-1 | Consistencia de estados de pago | El dominio ya tiene `Booking`, `Payment` y `BookingPayment`, pero sigue faltando una tabla de estados y tests de flujo completos. | Definir transiciones validas y cubrir checkout, webhook, cancelacion y refund. |
| SEV-1 | Tests de integracion de flujos criticos | Hay mucha cobertura unitaria, pero no una red clara de pruebas sobre reservas, pagos y cancelaciones. | Anadir integracion sobre APIs de mayor impacto. |
| SEV-2 | Rate limit apto para serverless | `src/lib/rate-limit.ts` sigue siendo un `Map` en memoria. | Mover a adapter distribuido con fallback local. |
| SEV-2 | Carga de DB en auth | `src/lib/auth.ts` refresca datos de club en cada callback JWT. | Introducir refresco controlado o cache corto para bajar lecturas repetidas. |
| SEV-2 | Observabilidad y setup de Sentry | La base esta puesta, pero sigue siendo una integracion minima. | Revisar setup final, contexto util y warnings de build. |

## Orden recomendado
1. Tooling y CI.
2. Importacion segura de socios.
3. Estados de pago + tests de integracion.
4. Rate limit distribuido.
5. Reduccion de carga en auth.
6. Pulido de observabilidad.

## Regla de mantenimiento
Si un punto queda resuelto en codigo y verificado, se elimina de aqui. Este archivo no debe volver a crecer como historial de tickets cerrados.
