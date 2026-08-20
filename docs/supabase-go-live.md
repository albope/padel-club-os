# Supabase Pro: arranque limpio y salida a producción

Decisión adoptada el 20 de agosto de 2026: PostgreSQL de producción se alojará
en un único proyecto de Supabase Pro y arrancará desde cero con un club demo.
No se migrarán datos de Neon ni se contratarán Neon Launch o el complemento IPv4
de Supabase.

La aplicación seguirá usando Prisma y PostgreSQL. No usará Supabase Auth, Storage
ni Data API. Esta última debe quedar desactivada para que las tablas de Prisma no
se expongan mediante PostgREST.

Referencias oficiales:

- [Prisma con Supabase](https://supabase.com/docs/guides/database/prisma)
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

## 4. Inicialización limpia

La inicialización se hace contra el proyecto nuevo antes de cambiar variables en
Vercel. No se usa `prisma db push`, no se importa ningún volcado de Neon y no se
copian datos personales antiguos.

- [ ] Confirmar que el proyecto Supabase está vacío y que es el destino correcto.
- [ ] Cargar `DATABASE_URL` y `DIRECT_URL` de Supabase solo como variables
  temporales de la terminal.
- [ ] Ejecutar las migraciones versionadas y comprobar el esquema:

  ```bash
  npm run db:deploy
  npx prisma migrate status
  npm run db:preflight
  ```

- [ ] Generar y guardar en el gestor de contraseñas tres claves distintas para
  `BOOTSTRAP_SUPERADMIN_PASSWORD`, `DEMO_ADMIN_PASSWORD` y
  `DEMO_PLAYER_PASSWORD`.
- [ ] Cargar temporalmente esas claves, `BOOTSTRAP_SUPERADMIN_EMAIL` y
  `NODE_ENV=production`, y ejecutar `npm run db:seed-demo`.
- [ ] Retirar de la terminal las cuatro variables de credenciales después del seed.
- [ ] Comprobar que existen el superadministrador y `Club Pádel Demo`, con pistas,
  socios, reservas, pagos, partidas, noticias y una competición finalizada.
- [ ] Entrar con los tres perfiles y guardar sus credenciales únicamente en el
  gestor de contraseñas.
- [ ] Ejecutar `npm run production:preflight` con la configuración de producción.

El seed es idempotente para el club demo. Si se repite, restaura sus datos, rota
las contraseñas configuradas y revoca las sesiones anteriores del superadministrador.

## 5. Corte de producción

1. Confirmar que la inicialización limpia y el smoke local están en verde.
2. Actualizar `DATABASE_URL` y `DIRECT_URL` en Vercel sin mostrar sus valores.
3. Desplegar el commit validado y comprobar `/api/health` y `/api/ready`.
4. Ejecutar el smoke de superadministrador, administrador y jugador.
5. Probar una suscripción Stripe TEST o
   una operación LIVE controlada según el runbook de pagos.
6. Confirmar la primera copia diaria y ejecutar el simulacro de restauración.
7. Eliminar las variables antiguas de Neon después de validar el nuevo despliegue.

## 6. Copias y restauración sin PITR

- [ ] Confirmar que aparece una copia diaria y que la retención efectiva es de
  siete días.
- [ ] Crear un volcado lógico cifrado antes de cada migración de Prisma o
  importación masiva.
- [ ] Ensayar trimestralmente una restauración en un proyecto aislado y registrar
  el tiempo real de recuperación.
- [ ] Después de restaurar una copia, restablecer la contraseña del usuario
  personalizado `prisma` y volver a comprobar ambas conexiones. Las copias diarias
  no conservan contraseñas de roles personalizados.
- [ ] Documentar comercialmente RPO de 24 horas. No prometer PITR ni un RPO menor.

La restauración nunca se prueba sobre producción.
