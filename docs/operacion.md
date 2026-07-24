# Operación en producción

Runbook de Padel Club OS. La aplicación no debe aceptar clientes de pago hasta
que `npm run production:preflight`, la migración y `/api/ready` estén en verde.

## Servicios y responsabilidad

| Servicio | Uso | Condición de lanzamiento |
|---|---|---|
| Vercel Pro | Hosting, funciones y tres crons | Obligatorio: el cron de reembolsos corre cada 10 minutos y el de recordatorios cada 15 |
| Neon PostgreSQL | Datos multi-tenant | Producción separada de desarrollo, snapshot previo a migrar |
| Stripe Live | Suscripciones y cobros | Productos, prices, webhook y tratamiento fiscal verificados |
| Resend | Emails transaccionales | Dominio verificado y remitente probado |
| Vercel Blob | Imágenes subidas por clubes | Store enlazado y token Read/Write |
| Upstash Redis | Rate limiting distribuido | Backend `upstash`, nunca memoria |
| Sentry | Errores y contexto técnico | DSN servidor/cliente y alertas activas |
| healthchecks.io | Ausencia de ejecuciones cron | Un check independiente por cron |
| Monitor externo | Uptime y base de datos | GET de `/api/health` cada 5 minutos |

El plan Hobby de Vercel no sirve para este despliegue: limita cada cron a una
ejecución diaria y su uso es personal/no comercial. `vercel.json` necesita
intervalos de 10 y 15 minutos.

## Puesta en marcha inicial

- [ ] Completar todas las variables de `.env.example` en Production.
- [ ] Establecer `LEGAL_ENTITY_TYPE=individual` y los datos reales del
  prestador: nombre y apellidos, NIF, domicilio y email.
- [ ] Confirmar con asesoría el alta censal, Seguridad Social, IVA/IRPF,
  facturación y conservación de registros; después establecer
  `TAX_HANDLING_CONFIRMED=true`.
- [ ] Configurar Stripe Live, probar una suscripción y un cobro/reembolso de
  reserva en modo test antes de copiar las claves live.
- [ ] Configurar los tres heartbeats y alertas de Sentry.
- [ ] Verificar dominio de Resend, VAPID, Blob y Upstash.
- [ ] Contratar Vercel Pro y fijar alertas/límite de gasto.
- [ ] Crear snapshot de Neon y ejecutar un simulacro de restauración en una
  rama aislada.
- [ ] Ejecutar el procedimiento de despliegue de la sección siguiente.

## Despliegue seguro

1. Crear snapshot de la rama de producción en Neon.
2. Ejecutar sobre el código exacto que se va a desplegar:

   ```bash
   npm ci
   npm run production:preflight
   npm run release:verify
   ```

3. Exportar temporalmente la `DATABASE_URL` de producción solo en la terminal
   controlada y ejecutar:

   ```bash
   npm run db:deploy
   ```

   `db:deploy` realiza primero comprobaciones de integridad y luego
   `prisma migrate deploy`. No usar `prisma db push` en producción.

4. Desplegar ese mismo commit desde Vercel.
5. Comprobar:

   ```text
   GET /api/health  -> 200, base de datos conectada
   GET /api/ready   -> 200, migración y configuración actuales
   ```

6. Ejecutar una vez cada cron con `Authorization: Bearer <CRON_SECRET>` y
   comprobar respuesta 200, log, heartbeat y efectos esperados.
7. Hacer smoke manual con las demos: plataforma, administrador de club y
   jugador. Confirmar login, cambio de vista, reserva y salida de impersonación.

## Crons

| Ruta | Frecuencia UTC | Objetivo | Heartbeat |
|---|---:|---|---|
| `/api/cron/generate-recurring-bookings` | Diario 06:00 | Generar reservas fijas con 7 días de antelación | `HEARTBEAT_URL_RECURRING` |
| `/api/cron/booking-reminders` | Cada 15 min | Recordar la próxima hora y cancelar checkout impagado tras 15 min | `HEARTBEAT_URL_REMINDERS` |
| `/api/cron/process-refunds` | Cada 10 min | Reconciliar y reintentar reembolsos durables | `HEARTBEAT_URL_REFUNDS` |

Los endpoints aceptan GET de Vercel Cron y POST manual, siempre protegidos por
`CRON_SECRET`. Los recordatorios se reclaman de forma atómica para no duplicar
avisos; la cancelación por impago vuelve a comprobar el estado justo antes de
escribir. Los reembolsos usan una clave de idempotencia estable.

Alertas sugeridas:

- recurrentes: periodo 24 h, gracia 2 h;
- recordatorios: periodo 15 min, gracia 15 min;
- reembolsos: periodo 10 min, gracia 10 min.

Una respuesta 500 no envía heartbeat. Una respuesta 401 indica secreto ausente
o distinto. Revisar Sentry y logs de Vercel antes de reintentar.

## Reembolsos

`RefundOperation` es la fuente durable. Una caída entre la cancelación y Stripe
no pierde el reembolso: el cron vuelve a intentarlo con la misma clave.

Si `/api/ready` muestra `refunds: attention`:

1. Abrir `/dashboard/reportes` y los logs `REFUND_*`.
2. Comprobar el pago/reembolso en Stripe.
3. Corregir la causa externa (saldo, credenciales, cuenta o indisponibilidad).
4. Ejecutar manualmente `/api/cron/process-refunds`.
5. Verificar que `RefundOperation.status=SUCCEEDED` y que reserva/pago figuran
   como reembolsados. No crear un segundo reembolso manual sin reconciliar la
   operación existente.

## Incidentes

### Aplicación o base de datos caída

1. Consultar monitor externo, `/api/health` y `/api/ready`.
2. Revisar el último deployment y los logs de Vercel.
3. Revisar Sentry y el estado de Neon/Stripe/Resend.
4. Si el despliegue es la causa, promover el último deployment bueno.

Un rollback de Vercel no revierte la base de datos. Las migraciones deben ser
aditivas y compatibles con el código anterior. Si no lo son, recuperar primero
en una rama de Neon y validar antes de tocar producción.

### Fuga o mezcla entre clubes

1. Desactivar temporalmente el acceso afectado o promover el deployment bueno.
2. Conservar logs y no borrar evidencia.
3. Identificar usuarios, clubes y datos expuestos.
4. Rotar sesiones con `sessionVersion` si procede.
5. Escalar de inmediato la evaluación de brecha de datos; no improvisar la
   comunicación legal.

### Stripe o webhook

1. Revisar eventos y reintentos del endpoint en Stripe.
2. Confirmar que `StripeWebhookEvent` registra el evento y su estado.
3. Reenviar el mismo evento; la ruta es idempotente.
4. Ejecutar el cron de reembolsos si hay operaciones pendientes.

## Copias y restauración

- Crear snapshot manual antes de cada migración o importación masiva.
- Mantener una ventana PITR suficiente para el SLA comercial.
- Trimestralmente, crear una rama desde snapshot/PITR, ejecutar
  `prisma migrate status`, consultar datos críticos y documentar tiempo de
  recuperación.
- Nunca probar una restauración directamente sobre la rama de producción.

## Observabilidad mínima

- monitor externo de `/api/health`;
- alerta de nuevo error y spike en Sentry;
- tres heartbeats;
- alerta de gasto de Vercel/Stripe;
- revisión diaria de reportes de usuario durante los primeros clientes;
- revisión semanal de reembolsos fallidos, webhooks y crecimiento de la base.

Última actualización: 2026-07-24.
