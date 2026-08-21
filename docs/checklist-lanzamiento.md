# Checklist maestro de lanzamiento

Estado comprobado el 21 de agosto de 2026. Este documento separa la salida de una
demo o piloto controlado de la activación de cobros reales. No se marca una tarea
externa como terminada sin comprobarla en el servicio correspondiente.

## Decisiones cerradas

- [x] BORT PEREZ MULTI GESTION SOCIEDAD LIMITADA será la sociedad emisora.
- [x] La sociedad generará las facturas SaaS y las entregará mensualmente a la gestoría.
- [x] El email público se mantiene en `albertobort@gmail.com`.
- [x] La contratación será exclusivamente mensual durante el lanzamiento.
- [x] Las subidas de plan serán inmediatas y cobrarán la diferencia proporcional.
- [x] Las bajadas se aplicarán en la siguiente renovación mensual.
- [x] Las reservas se cobrarán presencialmente en el club. No se reactivará Stripe Connect.
- [x] Producción arrancará limpia en un proyecto propio dentro de una organización
  Supabase Pro compartida con otro proyecto Micro, sin migrar Neon.
- [x] Un tercer MVP permanecerá en una organización Free y se acepta que Supabase
  lo pause si no registra actividad durante una semana.
- [x] Prisma usará Supavisor compartido y no necesita el complemento IPv4 de Supabase.
- [x] El historial publicado se saneó tras detectar una credencial en
  `docs/supabase.txt`. La contraseña expuesta quedó desactivada y el archivo fue
  purgado de las tres ramas publicadas el 21 de agosto de 2026.

## Puerta A: código preparado

- [x] Migraciones versionadas reproducibles desde una base PostgreSQL vacía.
- [x] Seed idempotente con superadministrador, club demo y datos representativos.
- [x] Demo con administrador, jugadores, pistas, tarifas, reservas, pagos,
  partidas, noticias y una competición finalizada.
- [x] Identidad legal, fiscal y política de cambios de plan reflejadas en código y textos.
- [x] Portal de jugador y flujos Marcador principales migrados a tokens semánticos.
- [x] `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` en verde
  sobre el commit final. Resultado del 21 de agosto de 2026: 629 tests y 125
  rutas generadas. Último `npm audit`, ejecutado el 20 de agosto de 2026: 0
  vulnerabilidades.
- [ ] Gate visual manual en 360, 768, 1024 y 1440 píxeles, en claro y oscuro.

## Puerta B: Supabase y demo local

Seguir `docs/supabase-go-live.md`. Estas tareas requieren acceso de Alberto a Supabase.

- [x] Pasar a Pro la organización elegida y crear en ella el proyecto vacío de
  Padel Club OS en una región de la UE.
- [ ] Confirmar MFA en las cuentas con acceso. Las contraseñas ya están en el
  gestor y Data API está desactivada.
- [ ] Generar una contraseña nueva para el usuario `prisma`, guardarla solo en
  el gestor y reconstruir `DATABASE_URL` y `DIRECT_URL`. La contraseña anterior
  está desactivada y no debe reutilizarse.
- [x] Aplicar las cinco migraciones de producto y la migración de hardening, con
  sus checksums en `_prisma_migrations`. Resultado: 38 tablas de aplicación y
  seis migraciones Prisma finalizadas.
- [x] Mover `btree_gist` a `extensions` y añadir los 20 índices de claves
  foráneas que faltaban. El advisor de seguridad queda sin hallazgos y no quedan
  foreign keys sin índice.
- [ ] Autorizar y aplicar
  `20260821120000_rls_and_data_api_role_lockdown`. La migración ya está
  preparada, pero no se ha ejecutado: RLS continúa desactivado y `anon` y
  `authenticated` conservan privilegios sobre las tablas, aunque Data API esté
  desactivada.
- [ ] Ejecutar preflight y seed contra el proyecto nuevo.
- [ ] Guardar las tres contraseñas demo en el gestor y retirarlas de la terminal.
- [ ] Levantar la aplicación local y probar superadministrador, administrador y jugador.
- [ ] Completar el gate visual y corregir cualquier incidencia reproducible.
- [ ] Confirmar la primera copia diaria y ensayar una restauración aislada.

## Puerta C: piloto desplegado sin cobros reales

- [ ] Establecer `LAUNCH_STAGE=pilot`, mantener Stripe en TEST y
  `TAX_HANDLING_CONFIRMED=false`.
- [ ] Copiar a Vercel las variables de Supabase y las variables obligatorias de producción.
- [ ] Desplegar el commit final solo después de que la nueva base esté inicializada.
- [ ] Comprobar `https://padelclubos.com/api/health` y `/api/ready` con respuesta 200.
- [ ] Ejecutar el smoke de superadministrador, administrador y jugador en el dominio real.
- [ ] Confirmar que el dominio y el certificado de `padelclubos.com` siguen activos.
- [ ] Verificar en Resend que el dominio figura como `Verified` y realizar un envío real.
- [ ] Configurar Blob si se permitirán subidas, VAPID si se ofrecerán avisos push y
  Sentry si el piloto tendrá monitorización de errores.

Vercel Hobby permite el piloto limitado con los crons diarios actuales. Vercel Pro
será necesario antes de recuperar frecuencias de 10 o 15 minutos o depender de una
operación comercial con automatizaciones frecuentes.

## Puerta D: primer cobro real

Seguir `docs/stripe-go-live.md` en una sesión guiada.

- [ ] Cambiar a `LAUNCH_STAGE=commercial` solo al iniciar la validación final de cobros.
- [ ] Activar y verificar la cuenta Stripe LIVE de la sociedad.
- [ ] Crear los tres precios mensuales LIVE y configurar Customer Portal.
- [ ] Aplicar prorrateo inmediato a subidas y cambio al renovar a bajadas.
- [ ] Crear el webhook LIVE, copiar sus secretos a Vercel y comprobar respuestas 2xx.
- [ ] Configurar Stripe Tax e identidad fiscal según el criterio de la gestoría.
- [ ] Generar y validar una factura de muestra y su exportación mensual.
- [ ] Activar `TAX_HANDLING_CONFIRMED=true` solo después de validar esa factura.
- [ ] Ejecutar una compra controlada, una renovación, un impago y una cancelación.
- [ ] Activar alertas Sentry, monitor de uptime y los tres heartbeats operativos.

No aceptar un pago real hasta cerrar la puerta D. El objetivo actual termina al
cerrar A, B y C. La puerta D se mantiene como tarea final separada.
