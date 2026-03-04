-- =============================================================================
-- Backfill paymentMethod para reservas legacy (dos fases)
-- Ejecutar DESPUES de desplegar el codigo que stampa paymentMethod en nuevas reservas.
-- =============================================================================

-- FASE 1: Automatica segura
-- Reservas exentas: ya sabemos que son exempt
UPDATE "Booking" SET "paymentMethod" = 'exempt'
WHERE "paymentMethod" IS NULL AND "paymentStatus" = 'exempt';

-- Reservas con pago online completado: sabemos que fueron online
UPDATE "Booking" SET "paymentMethod" = 'online'
WHERE "paymentMethod" IS NULL
  AND "id" IN (SELECT "bookingId" FROM "Payment" WHERE "type" = 'booking');

-- FASE 2: Auditoria manual
-- Las filas restantes con paymentMethod=NULL necesitan revision manual.
-- Hasta que se resuelvan, checkout y reschedule devuelven 409.
-- Ejecutar esta query para identificarlas:

-- SELECT id, "clubId", "userId", "paymentStatus", "createdAt", "startTime"
-- FROM "Booking" WHERE "paymentMethod" IS NULL;

-- Opciones para resolver cada fila:
--   UPDATE "Booking" SET "paymentMethod" = 'presential' WHERE id = '<id>';
--   UPDATE "Booking" SET "paymentMethod" = 'exempt' WHERE id = '<id>';
