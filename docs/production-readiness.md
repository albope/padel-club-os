# Auditoría y hoja de ejecución production-ready

Estado auditado a 2026-07-24. Este documento es la memoria operativa de lo
implementado y de lo que depende de cuentas o decisiones externas.

## Criterio de salida

El código queda listo para piloto cuando `npm run release:verify` y el E2E
crítico terminan en verde. Un lanzamiento comercial exige además:

- `npm run production:preflight` en verde con variables reales;
- migraciones aplicadas después de snapshot;
- `/api/ready` en 200;
- smoke de las tres vistas demo;
- todos los puntos externos del bloque 10 cerrados.

## Bloque 1 — Base de datos y multi-tenant

- [x] Consolidar un baseline reproducible desde una base vacía.
- [x] Añadir migraciones versionadas de producción, verificación de email y
  reembolsos durables.
- [x] Probar las migraciones en PostgreSQL aislado y comparar el schema final.
- [x] Modelar membresías por club y evitar conteos globales de usuarios.
- [x] Reforzar índices, integridad de relaciones y exclusión de solapes activos.
- [x] Incorporar preflight de inconsistencias antes de migrar producción.

## Bloque 2 — Identidad, autorización y aislamiento

- [x] Validar membresía exacta usuario/club en la sesión.
- [x] Invalidar sesiones con `sessionVersion`.
- [x] Bloquear mutaciones con suscripción inactiva, incluidos jugadores.
- [x] Revisar permisos de reservas, notificaciones, equipo y plataforma.
- [x] Verificar pertenencia de pista antes de consultar disponibilidad.
- [x] Añadir verificación de email y aprobación de membresía.
- [x] Cubrir denegaciones, aislamiento e identidad con tests.

## Bloque 3 — MEJORA 1: demos, accesos e impersonación

- [x] Crear centro de acceso en `/dashboard/accesos`.
- [x] Mostrar accesos a plataforma, portal de administrador y portal jugador.
- [x] Generar clubes demo desde plataforma con datos consistentes.
- [x] Permitir impersonar una membresía concreta de admin, staff o jugador.
- [x] Exigir motivo, limitar a 30 minutos y registrar sesión de soporte.
- [x] Hacer la impersonación solo lectura y mostrar banner persistente.
- [x] Restaurar una sola vez la sesión original y auditar inicio/fin.
- [x] Probar origen, sujeto, club, auditoría y restauración.

## Bloque 4 — Reservas y tiempo

- [x] Centralizar validación de rango, horario, duración y antelación.
- [x] Aplicar timezone del club y cubrir cambios de fecha local.
- [x] Impedir solapes en aplicación y en PostgreSQL.
- [x] Proteger creación concurrente de reservas/partidas.
- [x] Corregir filtros de club en disponibilidad y solapes.
- [x] Hacer atómicos los recordatorios y la cancelación por checkout impagado.
- [x] Ejecutar recordatorios cada 15 minutos en producción.

## Bloque 5 — Pagos y suscripciones

- [x] Unificar transiciones válidas de estados de pago.
- [x] Hacer idempotente el webhook de Stripe y persistir sus eventos.
- [x] Crear cola durable de reembolsos con reintentos y reconciliación.
- [x] Usar clave estable de idempotencia para no reembolsar dos veces.
- [x] Añadir cron de reembolsos cada 10 minutos y señal de salud.
- [x] Bloquear funciones por límites de plan y contar membresías reales.
- [x] Cubrir pagos, cancelaciones, webhook y reembolsos con tests.

## Bloque 6 — Onboarding y operación del club

- [x] Hacer consistente el registro contractual del club.
- [x] Registrar versiones aceptadas de términos, privacidad y DPA.
- [x] Añadir verificación de email y alta de membresía.
- [x] Incorporar wizard y requisitos antes de publicar el club.
- [x] Evitar una portada comercial incompleta.
- [x] Mantener importaciones y operaciones sensibles bajo permiso y auditoría.

## Bloque 7 — Feedback e interfaz

- [x] Añadir un botón discreto de feedback en admin y portal jugador.
- [x] Recoger categoría, descripción, ruta sin query, viewport y contexto mínimo.
- [x] Excluir metadatos arbitrarios y no recoger contraseñas.
- [x] Limitar abuso y enviar señal a Sentry.
- [x] Crear bandeja de triaje en `/dashboard/reportes`.
- [x] Auditar cambios de estado del reporte.
- [x] Añadir imágenes por defecto para club, pista, noticia y jugador.
- [x] Integrar fallbacks para datos históricos sin imagen.
- [x] Aplicar la identidad visual Marcador y tokens semánticos.

## Bloque 8 — Seguridad y privacidad

- [x] Rate limiting distribuido obligatorio en producción.
- [x] Validar tipo, tamaño, nombre y autorización de uploads.
- [x] Añadir cabeceras CSP, anti-sniff y seguridad de navegador.
- [x] Reducir datos almacenados en feedback y logs.
- [x] Mantener exportación y eliminación de datos disponibles.
- [x] Actualizar dependencias vulnerables y dejar `npm audit` sin hallazgos.
- [x] Fijar Node 20.19+ en proyecto y CI.

## Bloque 9 — Calidad, CI y observabilidad

- [x] Lint sin warnings y typecheck independiente.
- [x] Tests unitarios e integración de rutas críticas.
- [x] Build real de Next.js 15.
- [x] E2E con registro, activación controlada, reserva, móvil y cabeceras.
- [x] CI con PostgreSQL 16 efímero, migraciones y auditoría de dependencias.
- [x] Endpoint `/api/ready` para migración, configuración y reembolsos fallidos.
- [x] Preflight estricto sin mostrar secretos.
- [x] Runbook de deploy, rollback, crons, reembolsos y restauración.

## Bloque 10 — Bloqueos externos antes de cobrar

Estos puntos no se pueden completar desde el repositorio ni deben inventarse:

- [ ] Datos reales del prestador persona física: nombre y apellidos, NIF,
  domicilio y email.
- [ ] Alta censal y situación en Seguridad Social confirmadas antes de iniciar
  la actividad comercial.
- [ ] Tratamiento de IVA/IRPF, facturas y registros confirmado con asesoría;
  entonces `TAX_HANDLING_CONFIRMED=true`.
- [ ] Stripe Live: cuenta verificada, productos/prices, webhook, impuestos y
  prueba controlada.
- [ ] Resend: dominio/remitente verificado.
- [ ] Vercel Blob, VAPID, Upstash y Sentry configurados con claves reales.
- [ ] Vercel Pro activo por frecuencia de crons y uso comercial.
- [ ] Tres checks de healthchecks.io, alertas Sentry y monitor de uptime activos.
- [ ] Snapshot/restore drill de Neon completado y ventana PITR aceptada.
- [ ] Variables y DNS de producción verificados; migración y despliegue del
  commit final realizados.

No marcar el producto como comercialmente lanzado mientras este bloque tenga
casillas abiertas. Sí puede utilizarse localmente y en entornos demo aislados.
