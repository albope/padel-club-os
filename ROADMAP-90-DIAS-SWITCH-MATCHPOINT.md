# Roadmap 90 Dias

Fecha de referencia: 2026-03-04

## Punto de partida real
El producto ya no esta en fase cero. Hoy el workspace ya cubre:

- dashboard multi-tenant para club,
- portal jugador con reservas, partidas, rankings, noticias y perfil,
- pricing configurable por pista y duracion,
- pagos SaaS con Stripe y pagos online de reservas,
- pagos por jugador, recurrentes, recordatorios y waitlist,
- competiciones, rankings ELO, analiticas y notificaciones,
- base de seguridad, RGPD, PWA e i18n.

El roadmap de 90 dias debe partir de esta base y no rehacer trabajo ya hecho.

## Tesis
- Foco principal: switch desde Matchpoint u otro software similar.
- Foco secundario: entrada simple para clubes que siguen con WhatsApp, Excel o gestion manual.
- Regla: un solo producto, dos narrativas comerciales.

## Objetivo del periodo
Llegar a pilotos reales con una historia creible de migracion, operativa diaria estable y una UX de jugador claramente mejor que la alternativa legacy.

## Bloques prioritarios

### 0 a 30 dias
- Cerrar confianza tecnica: `lint`, `typecheck`, `test`, `build` y CI.
- Corregir deuda que frena migracion real: importacion segura de socios y consistencia de pagos.
- Definir dataset minimo de migracion v1: socios, pistas, precios, reservas futuras y configuracion basica.
- Preparar materiales de venta y onboarding para demos de switch.

### 31 a 60 dias
- Construir la capa de migracion operativa: importacion util de socios, pistas/precios y reservas futuras.
- Cerrar blockers de recepcion que aun faltan: horarios especiales, cierres, bloqueos y audit log.
- Resolver multi-admin/staff con flujo real de invitacion y limites por plan.
- Dejar un setup simplificado para clubes pequenos sin abrir una segunda linea de producto.

### 61 a 90 dias
- Empaquetar la diferenciacion de jugador: waitlist cerrada, repetir reserva, compartir mejor y portal mas pulido.
- Mejorar narrativa de cambio: comparativa vs Matchpoint, demo de recepcion y demo de jugador.
- Convertir 1 o 2 pilotos en caso de exito reusable.
- Dejar una base clara para bonos/cuotas solo si los pilotos lo exigen de verdad.

## Backlog vivo

### Ahora
- CI y comandos de calidad.
- Importacion segura de socios.
- Contrato de estados de pago.
- Dataset de migracion v1.
- Material comercial minimo para demos.

### Siguiente
- Importacion de pistas, precios y reservas futuras.
- Multi-admin y permisos operativos.
- Horarios especiales y bloqueos.
- Audit log basico.

### Despues
- Repetir reserva.
- Pulido de UX jugador y branding del portal.
- Comparativa publica y packaging comercial dual.
- Bonos/cuotas si aparecen como blocker repetido en discovery.

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
