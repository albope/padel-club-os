-- Los usuarios existentes se consideran verificados para no bloquear cuentas
-- creadas antes de habilitar el flujo. Las altas posteriores quedan sin
-- verificar hasta consumir el enlace de un solo uso.
UPDATE "User"
SET "emailVerified" = CURRENT_TIMESTAMP
WHERE "email" IS NOT NULL
  AND "emailVerified" IS NULL;
