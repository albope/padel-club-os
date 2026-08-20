# Supabase Pro: migración desde Neon y salida a producción

Decisión adoptada el 20 de agosto de 2026: PostgreSQL de producción se alojará
en un único proyecto de Supabase Pro. No se contratará Neon Launch ni el
complemento IPv4 de Supabase.

La aplicación seguirá usando Prisma y PostgreSQL. No usará Supabase Auth, Storage
ni Data API. Esta última debe quedar desactivada para que las tablas de Prisma no
se expongan mediante PostgREST.

Referencias oficiales:

- [Prisma con Supabase](https://supabase.com/docs/guides/database/prisma)
- [Migración desde Neon](https://supabase.com/docs/guides/platform/migrating-to-supabase/neon)
- [Conexiones a PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Copias de seguridad](https://supabase.com/docs/guides/platform/backups)

## Coste y alcance aceptados

- Supabase Pro incluye créditos mensuales suficientes para un proyecto Micro.
- Un segundo proyecto Micro dentro de la organización Pro añade consumo de
  cómputo. Producción será el único proyecto de esa organización.
- Desarrollo usará PostgreSQL local o un proyecto gratuito en otra organización.
- Las copias diarias incluidas conservan los últimos siete días. No se activa
  PITR en el lanzamiento, por lo que se acepta un RPO de hasta 24 horas.
- Supabase Pro debe mantenerse mientras aloje producción. La contratación por
  tres meses no autoriza a bajar el proyecto a Free sin migrarlo antes.

## 1. Crear y asegurar el proyecto

- [ ] Crear una organización Pro y un único proyecto de producción en una región
  de la Unión Europea próxima a Vercel.
- [ ] Guardar la contraseña de la base en el gestor de contraseñas. No compartirla
  por chat, tickets, documentación ni Git.
- [ ] Activar MFA para las cuentas con acceso a Supabase.
- [ ] Desactivar Data API en `Project Settings > API`, ya que la aplicación accede
  exclusivamente mediante Prisma.
- [ ] Descargar y conservar el DPA vigente de Supabase para el registro de
  subencargados.
- [ ] Configurar alertas de presupuesto y revisar el Spend Cap. El cómputo no está
  cubierto por todos los límites del Spend Cap.

## 2. Crear el usuario de Prisma

Ejecutar en el SQL Editor la receta actual de la guía oficial de Prisma. Sustituir
la contraseña de ejemplo por una generada y guardada en el gestor:

```sql
create user "prisma" with password '<CONTRASEÑA_GENERADA>' bypassrls createdb;
grant "prisma" to "postgres";
grant usage, create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

La aplicación no usa las claves `anon` ni `service_role`. No deben añadirse a
Vercel.

## 3. Configurar conexiones

En Vercel Production y Preview:

- `DATABASE_URL`: usuario `prisma`, Supavisor en modo transacción, puerto 6543,
  con `pgbouncer=true&connection_limit=1`.
- `DIRECT_URL`: usuario `prisma`, Supavisor en modo sesión, puerto 5432.

El modo sesión soporta IPv4 compartida y evita contratar el complemento IPv4.
Prisma usa `DIRECT_URL` para migraciones. Los scripts administrativos prefieren
también esa conexión y mantienen `DATABASE_URL` como compatibilidad local.

## 4. Ensayo de migración

El ensayo es obligatorio y se hace contra el proyecto nuevo, antes de cambiar
variables en Vercel.

- [ ] Confirmar que destino es el proyecto Supabase nuevo y que no contiene datos
  que deban conservarse.
- [ ] Obtener de Neon una conexión directa sin pool y de Supabase el pool de sesión
  del usuario `postgres`.
- [ ] Guardar ambas URL solo como variables temporales de la terminal.
- [ ] Ejecutar `npm run db:preflight` contra Neon.
- [ ] Exportar únicamente el esquema `public` con `pg_dump`, usando
  `--format=custom --no-owner --no-privileges`.
- [ ] Restaurar el archivo en Supabase con `pg_restore`, sin usar `--clean`.
- [ ] Volver a conceder al usuario `prisma` los permisos del apartado 2.
- [ ] Configurar `DATABASE_URL` y `DIRECT_URL` localmente contra Supabase y ejecutar:

  ```bash
  npm run db:preflight
  npx prisma migrate status
  npm run production:preflight
  ```

- [ ] Comparar por tabla los recuentos de Neon y Supabase.
- [ ] Desplegar una Preview y comprobar login, reservas, competiciones, Stripe,
  correo y `/api/ready`.

El volcado contiene datos personales. Debe guardarse cifrado, excluirse de Git y
eliminarse de forma segura tras validar la migración y el rollback.

## 5. Corte de producción

1. Anunciar una ventana breve de mantenimiento e impedir escrituras.
2. Ejecutar un último preflight y volcado desde la conexión directa de Neon.
3. Restaurar en el proyecto Supabase ya ensayado.
4. Comparar recuentos y ejecutar `npm run db:preflight`.
5. Actualizar `DATABASE_URL` y `DIRECT_URL` en Vercel sin mostrar sus valores.
6. Desplegar el commit validado y comprobar `/api/health` y `/api/ready`.
7. Ejecutar el smoke de administrador y jugador y una suscripción Stripe TEST o
   una operación LIVE controlada según el runbook de pagos.
8. Reabrir escrituras.
9. Mantener Neon sin escrituras durante siete días como rollback y cancelarlo
   después de superar la primera copia y el simulacro de restauración.

## 6. Copias y restauración sin PITR

- [ ] Confirmar que aparece una copia diaria y que la retención efectiva es de
  siete días.
- [ ] Crear un volcado lógico cifrado antes de cada migración de Prisma o
  importación masiva.
- [ ] Ensayar trimestralmente una restauración en un proyecto aislado y registrar
  el tiempo real de recuperación.
- [ ] Documentar comercialmente RPO de 24 horas. No prometer PITR ni un RPO menor.

La restauración nunca se prueba sobre producción.
