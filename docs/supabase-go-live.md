# Supabase Pro: arranque limpio y salida a producción

**Estado verificado:** 21 de agosto de 2026

El proyecto Pro está activo y las migraciones se aplicaron sobre una base
vacía. Hay 38 tablas de aplicación y seis registros finalizados en
`_prisma_migrations`. El seed todavía no se ha ejecutado.

El 21 de agosto de 2026 se detectó una contraseña del rol `prisma` en un archivo
versionado. La contraseña quedó desactivada, el archivo fue retirado y el
historial de las ramas publicadas fue reescrito. Antes de conectar Prisma debe
generarse una contraseña distinta y guardarse únicamente en el gestor.

Decisión adoptada el 20 de agosto de 2026: PostgreSQL de producción se alojará
en un proyecto propio dentro de una organización Supabase Pro compartida con
otro proyecto Micro. Arrancará desde cero con un club demo. No se migrarán datos
de Neon ni se contratarán Neon Launch o el complemento IPv4 de Supabase.

La aplicación seguirá usando Prisma y PostgreSQL. No usará Supabase Auth, Storage
ni Data API. Esta última debe quedar desactivada para que las tablas de Prisma no
se expongan mediante PostgREST.

Referencias oficiales:

- [Prisma con Supabase](https://supabase.com/docs/guides/database/prisma)
- [Conexiones a PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Copias de seguridad](https://supabase.com/docs/guides/platform/backups)

## Coste y alcance aceptados

- La organización Pro contendrá dos proyectos Micro activos, el que ya requiere
  Pro y Padel Club OS. El coste de referencia es 35 USD al mes antes de impuestos:
  25 USD del plan, 20 USD de cómputo y 10 USD de crédito mensual.
- Un tercer MVP permanecerá en una organización Free. Se acepta que Supabase lo
  pause tras una semana sin actividad y que el cliente financie su paso a Pro si
  necesita disponibilidad continua.
- Desarrollo de Padel Club OS usará PostgreSQL local y no añadirá otro proyecto
  de pago a la organización.
- Las copias diarias incluidas conservan los últimos siete días. No se activa
  PITR en el lanzamiento, por lo que se acepta un RPO de hasta 24 horas.
- Supabase Pro debe mantenerse mientras aloje producción. La contratación por
  tres meses no autoriza a bajar el proyecto a Free sin migrarlo antes.

## 1. Crear y asegurar el proyecto

- [x] Pasar a Pro la organización que alojará los dos proyectos Micro y crear en
  ella el proyecto de Padel Club OS en una región de la Unión Europea próxima a
  Vercel.
- [ ] Generar y guardar la nueva contraseña de la base en el gestor. No compartirla
  por chat, tickets, documentación ni Git.
- [ ] Activar MFA para las cuentas con acceso a Supabase.
- [x] Desactivar Data API en `Project Settings > API`, ya que la aplicación accede
  exclusivamente mediante Prisma.
- [ ] Descargar y conservar el DPA vigente de Supabase para el registro de
  subencargados.
- [ ] Configurar alertas de presupuesto y revisar el Spend Cap. El cómputo no está
  cubierto por todos los límites del Spend Cap.

## 2. Usuario de Prisma

El rol `prisma` ya existe con `LOGIN`, `CREATEDB`, `BYPASSRLS` y permisos sobre
`public`. Su autenticación por contraseña está desactivada como contención de la
credencial publicada.

Antes del seed:

1. generar una contraseña nueva en el gestor
2. ejecutar `ALTER ROLE prisma PASSWORD '<NUEVA_CONTRASEÑA>'` desde el SQL Editor
3. construir de nuevo las dos URLs de Supavisor
4. comprobar la conexión y no copiar la contraseña a archivos versionados.

La receta siguiente se conserva solo para reconstruir el rol si fuera necesario.

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

- [x] Confirmar que el proyecto estaba vacío y era el destino correcto antes de
  aplicar las migraciones.
- [ ] Cargar las nuevas `DATABASE_URL` y `DIRECT_URL` de Supabase solo como variables
  temporales de la terminal.
- [x] Ejecutar las cinco migraciones de producto y la migración de hardening. Se
  aplicaron mediante el conector oficial y se registraron los checksums reales
  en `_prisma_migrations`:

  ```bash
  npm run db:deploy
  npx prisma migrate status
  npm run db:preflight
  ```

  Los comandos quedan pendientes de repetirse mediante la conexión `prisma`
  nueva para validar el recorrido exacto que usará la aplicación.

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
5. Dejar la prueba Stripe fuera de este corte. Se ejecutará en la fase final de
   cobros LIVE.
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

## 7. Hardening pendiente de decisión

El advisor de Supabase detecta RLS desactivado y las comprobaciones SQL confirman
que `anon` y `authenticated` conservan privilegios sobre las 39 tablas públicas,
incluida `_prisma_migrations`. Data API está desactivada, pero esa configuración
no sustituye una defensa en profundidad.

La recomendación es habilitar RLS sin políticas en todas las tablas y revocar
privilegios a `anon` y `authenticated`. La aplicación no debería verse afectada
porque usa exclusivamente el rol `prisma` con `BYPASSRLS`. Esta decisión debe
aprobarse y probarse antes del seed.

La migración reproducible
`20260821120000_rls_and_data_api_role_lockdown` está preparada en el repositorio,
pero no se ha aplicado. Supabase requiere una autorización explícita que nombre
el alcance de las 39 tablas y la revocación de ambos roles.

`btree_gist` ya está en el esquema `extensions` y las 20 claves foráneas que no
tenían índice cuentan ahora con uno. El advisor de seguridad no devuelve
hallazgos. Los avisos de índices sin uso se ignoran mientras la base esté vacía.
