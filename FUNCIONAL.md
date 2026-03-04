# Estado Funcional del Producto

Fecha de referencia: 2026-03-04

## Objetivo
Foto corta del producto actual. Este archivo ya no intenta listar cada pantalla o cada componente.

## Base funcional disponible

### Operativa de club
- Dashboard con KPIs, agenda diaria y resumen financiero.
- CRUD de reservas, pistas, socios, noticias, blog y partidas abiertas.
- Pricing por pista y franjas.
- Reservas recurrentes.
- Exportacion de reservas, socios y pagos.

### Portal jugador
- Reservar pista desde grid visual.
- Ver tarifas, noticias, rankings y competiciones.
- Crear, unirse y salir de partidas abiertas.
- Perfil con historial, cancelacion y edicion de datos.
- Recuperacion de password.

### Competicion y comunidad
- Competiciones tipo liga, knockout y grupos + knockout.
- Rankings ELO por club.
- Base social ya presente en el dominio: chat de partida, valoraciones y perfiles/jugadores.

### Pagos, comunicacion y plataforma
- Facturacion SaaS con Stripe.
- Pagos online de reservas y tracking de pagos por jugador.
- Notificaciones push, email e in-app.
- RGPD, auth con roles, permisos y cabeceras de seguridad.
- PWA e i18n.

## Modulos a consolidar
- Waitlist de reservas: ya existe en schema, APIs y UI; necesita validacion final de experiencia y automatismos.
- Reagendar reservas y compartir enlaces: presentes en el workspace, pero aun forman parte del pulido de UX.
- Integracion financiera: la base esta, pero falta cerrar bien contrato de estados y pruebas de flujo.

## Huecos reales que siguen abiertos
- Multi-admin y flujo de invitacion de staff.
- Horarios especiales, cierres y bloqueos operativos.
- Audit log de acciones relevantes.
- Importacion/migracion mas seria para switching.
- CI y validacion automatica de calidad.
- Material comercial y operativo para pilotos.

## Lo que este archivo ya no hace
- No mantiene un inventario pantalla a pantalla.
- No funciona como roadmap historico.
- No duplica tickets tecnicos ni backlog comercial.

Para detalle tecnico, la referencia real es el codigo en `src/` y `prisma/schema.prisma`.
