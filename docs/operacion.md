# Operación en producción — Runbook

Guía operativa de Padel Club OS en producción (https://padelclubos.com).
Objetivo: enterarse de los problemas antes que los clientes y saber qué hacer en cada caso.

**Mapa de servicios:**

| Servicio | Qué hace | Dónde |
|---|---|---|
| Vercel (plan Hobby) | Hosting, deploys, crons, logs | https://vercel.com/dashboard |
| Neon PostgreSQL | Base de datos (prod + rama `dev`) | https://console.neon.tech |
| Sentry | Captura de errores | https://sentry.io |
| Resend | Emails transaccionales | https://resend.com |
| UptimeRobot | Monitor de uptime (a crear, sección 1) | https://uptimerobot.com |
| healthchecks.io | Monitor de crons (a crear, sección 2) | https://healthchecks.io |

---

## Checklist de puesta en marcha (acciones manuales del dueño)

Una sola vez, ~40 minutos en total. Los puntos son independientes: hazlos en cualquier orden.

- [x] **1. UptimeRobot** (~10 min): crear cuenta gratuita + monitor de `/api/health` cada 5 min con alerta por email → sección 1 — ✅ hecho 23/07/2026
- [x] **2. healthchecks.io** (~15 min): crear cuenta gratuita + 2 checks, copiar las ping URLs a las env vars de Vercel y redeploy → sección 2 — ✅ hecho 23/07/2026, verificado invocando ambos crons manualmente (pings recibidos)
- [ ] **3. Alertas de Sentry** (~10 min): crear 2 alert rules (nuevo error en prod, spike de eventos) → sección 6 — ⏸️ pospuesto conscientemente (23/07/2026); la captura de errores sigue activa, pero sin email proactivo: revisar el dashboard de Sentry de vez en cuando hasta crear las reglas
- [x] **4. Neon** (~5 min): verificar la ventana de restauración del plan actual → sección 4 — ✅ verificado 23/07/2026: **1 día**
- [ ] **5. Cuando se facture al primer club**: pasar Vercel a plan Pro → sección 8

---

## 1. Monitor de uptime (UptimeRobot)

Un monitor externo que hace GET a `/api/health` cada 5 minutos cumple doble función:

1. **Alerta si producción cae** (email en minutos).
2. **Mantiene calientes** la función serverless y el compute de Neon (autosuspend por defecto: 5 min de inactividad). Esto mitiga el cold start de ~1,5 s que ve la primera visita tras un rato sin tráfico.

### Guía click a click (free tier: checks de 5 min, alertas por email)

1. Entra en https://uptimerobot.com → **Register** con tu email (albertobort@gmail.com) → confirma el email.
2. En el dashboard: **+ New monitor**.
3. Configura:
   - **Monitor type**: `HTTP(s) - Keyword` (si tu plan no lo permite, usa `HTTP(s)` a secas: también sirve).
   - **Friendly name**: `Padel Club OS - Health`.
   - **URL**: `https://www.padelclubos.com/api/health` (usa `www.` directamente: el apex redirige a www y así el check no depende del redirect).
   - **Keyword**: `"status":"ok"` — **Alert when: keyword not exists** (así alerta también si la ruta responde 200 pero la DB está caída... nota: si la DB falla, la ruta ya devuelve 503, pero el keyword es una segunda red de seguridad).
   - **Monitoring interval**: `5 minutes` (el mínimo del free tier).
4. **Alert contacts**: marca tu email (viene creado por defecto al registrarte).
5. **Create monitor**. Listo: si el sitio cae o el health check falla, recibirás un email; otro cuando se recupere.

**Qué comprueba `/api/health`**: hace un `SELECT 1` contra la DB (barato, sin queries pesadas) y devuelve `{"status":"ok","db":{"status":"connected","responseMs":N}}` con `Cache-Control: no-store` (nunca se cachea). Si la DB no responde: HTTP 503 con `"status":"error"`. `responseMs` es la latencia de la DB: valores normales <50 ms en caliente; ~500-1500 ms indica cold start del compute de Neon.

### Mejora futura (de pago, NO implementar aún)

- **BetterStack (Better Uptime)**: checks cada 30 s, alertas por llamada/SMS, página de status pública. Free tier con checks de 3 min. Interesante cuando haya clientes de pago.
- **Neon plan de pago (Launch, ~19 US$/mes)**: permite configurar/desactivar el autosuspend del compute → elimina el cold start de DB de raíz en vez de mitigarlo con pings.

---

## 2. Monitorización de crons (healthchecks.io)

**Problema que resuelve**: los 2 crons de Vercel (`generate-recurring-bookings` a las 6:00 UTC, `booking-reminders` a las 7:00 UTC) hacen trabajo silencioso. Si un día fallan o dejan de ejecutarse, nadie se entera hasta que un cliente pregunta por qué no se generó su clase fija.

**Cómo funciona**: al terminar **con éxito**, cada cron hace un GET a una "ping URL" de healthchecks.io (helper `src/lib/heartbeat.ts`, fire-and-forget: nunca rompe el cron, timeout 5 s, no hace nada si la env var no existe — en local y CI no se envía nada). healthchecks.io espera un ping al día por check; si no llega dentro del periodo + gracia, envía email. Cubre los dos modos de fallo: el cron no se ejecutó (Vercel) o se ejecutó pero terminó en error (el ping solo se envía en el camino de éxito).

### Guía click a click

1. Entra en https://healthchecks.io → **Sign Up** (free tier: 20 checks, sobra).
2. **Add Check** → nómbralo `cron-booking-reminders`.
   - **Period**: `1 day` (se espera 1 ping al día).
   - **Grace time**: `6 hours` (Vercel Hobby no garantiza la hora exacta del cron; con 6 h de margen no habrá falsas alarmas).
3. Copia la **ping URL** del check (formato `https://hc-ping.com/xxxxxxxx-...`).
4. Repite 2-3 con un segundo check `cron-generate-recurring-bookings`.
5. En **Integrations**, verifica que el email está activo como canal de alerta (viene por defecto).
6. En Vercel: proyecto → **Settings → Environment Variables** → añade (entorno **Production**):
   - `HEARTBEAT_URL_REMINDERS` = ping URL del check `cron-booking-reminders`
   - `HEARTBEAT_URL_RECURRING` = ping URL del check `cron-generate-recurring-bookings`
7. **Redeploy** para que las funciones cojan las nuevas variables: Deployments → deployment actual → menú `⋯` → **Redeploy**.
8. Al día siguiente, verifica en healthchecks.io que ambos checks están en verde (recibieron su ping).

---

## 3. Caída de producción — qué mirar, en orden

Cuando llegue un email de UptimeRobot (o alguien reporte que el sitio no va):

1. **UptimeRobot** → ¿qué falla exactamente? Caída total (timeout/5xx) vs keyword (respuesta sin `"status":"ok"` = problema de DB).
2. **Vercel** → proyecto → **Deployments**: ¿coincide la caída con un deploy reciente? Mira el estado del último deployment y sus **Runtime Logs** (pestaña Logs, filtra por `error`).
3. **Sentry** → ¿hay una avalancha de eventos nuevos? El primer issue tras el despliegue suele señalar la causa.
4. **Neon** → https://neonstatus.com y el dashboard del proyecto: ¿compute activo? ¿incidencia del proveedor?

### Rollback instantáneo en Vercel

Si la causa es un deploy malo, no intentes arreglar hacia delante bajo presión:

1. Vercel → proyecto → **Deployments**.
2. Localiza el último deployment **bueno** (anterior al malo, estado Ready).
3. Menú `⋯` del deployment → **Promote to Production** (o desde el deployment de producción actual: **Instant Rollback**).
4. Confirma. El cambio es instantáneo (no recompila: reutiliza el build anterior).
5. Ya sin presión: arregla la causa en una rama, verifica en CI y vuelve a desplegar.

**Ojo**: el rollback NO revierte migraciones de base de datos. Si el deploy malo cambió el schema (`prisma db push`), evalúa si el código antiguo funciona con el schema nuevo (añadir columnas/tablas suele ser compatible; renombrar/borrar no).

---

## 4. Recuperación de datos (Neon)

Neon guarda el historial de cambios (WAL) y permite restaurar cualquier rama a un punto en el tiempo (PITR) **dentro de la ventana de retención del plan**.

✅ **Verificado (23/07/2026)** — Retención actual: **1 día** (plan Free). Se consulta en: Neon console → selector **BRANCH** = `main` → **Backup & Restore** → "Restore from history ... **1 day history window**".
- Implicación: un borrado o corrupción accidental debe detectarse en **menos de 24 h** para ser recuperable por PITR. Con clientes reales de pago, valora el plan Launch (~19 US$/mes, ventana de 7 días) — junto con desactivar el autosuspend, es el segundo motivo para ese upgrade.
- El plan Free incluye **snapshots manuales** gratis (Backup & Restore → **Create snapshot**): crea uno justo antes de cualquier migración de schema o script masivo sobre producción — es un punto de restauración que no caduca a las 24 h. Los snapshots programados requieren plan de pago ("Upgrade for schedules").

### Restaurar datos de producción a un punto en el tiempo

1. Neon console → selector **BRANCH** (menú lateral) = `main` (producción, host `ep-flat-field-*`) → **Backup & Restore**.
2. En "Restore from history": elige en **Point in time** una fecha/hora **anterior** al incidente (ojo: el selector está en Europe/Madrid, no UTC).
3. Pulsa primero **Preview data** para inspeccionar cómo estaban los datos en ese instante SIN tocar nada. Para recuperar, el camino seguro es **crear una rama nueva desde ese punto** (no restaurar en el sitio):
   - **Branches** → **Create branch** → "From: main" → "At: point in time" → nombre `rescate-YYYYMMDD`.
4. **Validar** la rama de rescate: SQL Editor sobre esa rama (o `psql` con su connection string) → comprueba que los datos perdidos están.
5. Recuperar:
   - **Pérdida acotada** (unas filas/tabla): copia solo lo necesario de la rama de rescate a producción (`INSERT ... SELECT` vía `pg_dump -t tabla` de la rama de rescate + restore en prod).
   - **Pérdida total**: usa el "Restore" nativo de Neon sobre la rama de producción (Neon guarda automáticamente una rama backup del estado previo) o promociona la rama de rescate y actualiza `DATABASE_URL` en Vercel → Redeploy.
6. Borra la rama de rescate cuando termines (las ramas consumen almacenamiento).

### Refrescar la rama `dev` con datos frescos de producción

La rama `dev` (host `ep-dry-breeze-*`, la que usa `.env` local y el CI e2e) se queda anticuada. Para resetearla:

1. Neon console → **Branches** → rama `dev` → menú `⋯` → **Reset from parent**.
2. Confirma. `dev` pasa a ser una copia exacta del estado actual de producción; la connection string **no cambia** (no hay que tocar `.env` ni el secret `E2E_DATABASE_URL` de GitHub).
3. Ojo: se pierden los datos de prueba que hubiera en `dev`.

---

## 5. Crons — ver, invocar, interpretar

### Ver ejecuciones en Vercel

- Vercel → proyecto → pestaña **Cron Jobs** (o Settings → Cron Jobs): lista de los 2 crons con su schedule y última ejecución. Desde ahí, **View Logs** salta a los logs filtrados.
- Alternativa: pestaña **Logs** → filtra por ruta `/api/cron/`. Los crons emiten un log `info` con el resumen (p. ej. `RECURRING_BOOKINGS_CRON Procesadas: 3, Generadas: 2, ...`).
- En Hobby los crons son diarios y la hora exacta no está garantizada (puede ejecutarse con margen respecto a las 6:00/7:00 UTC): por eso el grace time de 6 h en healthchecks.io.

### Invocarlos manualmente

`CRON_SECRET` vive **solo en Vercel** (Settings → Environment Variables → revela el valor). Desde cualquier terminal:

```bash
curl -s -H "Authorization: Bearer $CRON_SECRET" https://www.padelclubos.com/api/cron/booking-reminders
curl -s -H "Authorization: Bearer $CRON_SECRET" https://www.padelclubos.com/api/cron/generate-recurring-bookings
```

Son idempotentes: ejecutarlos dos veces no duplica reservas ni recordatorios (marcan `reminderSentAt` / comprueban existencia antes de crear). Una invocación manual con éxito también envía el heartbeat (cuenta como el ping del día).

### Qué significan sus respuestas JSON

`/api/cron/booking-reminders`:

```json
{ "procesadas": 2, "enviadas": 2, "errores": 0, "canceladasPorPago": 1 }
```

- `procesadas`: reservas confirmadas que empiezan en la próxima hora sin recordatorio previo.
- `enviadas`: recordatorios enviados (notificación in-app + push + email).
- `errores`: recordatorios que fallaron (detalle en logs/Sentry).
- `canceladasPorPago`: reservas online auto-canceladas por no completar el pago en 15 min (libera el slot y avisa a la lista de espera).

`/api/cron/generate-recurring-bookings`:

```json
{ "procesadas": 3, "generadas": 2, "conflictos": 0, "bloqueados": 0, "omitidas": 1, "errores": 0 }
```

- `procesadas`: plantillas de clases fijas activas y vigentes evaluadas.
- `generadas`: reservas nuevas creadas (lookahead 7 días).
- `conflictos`: slots ya ocupados por otra reserva (no se crea, no es error).
- `bloqueados`: slots con bloqueo de pista.
- `omitidas`: plantillas de clubes sin suscripción activa.
- `errores`: fallos al crear una reserva concreta (detalle en logs/Sentry).

Ambos devuelven `401 {"error":"No autorizado"}` si el Bearer falta o es incorrecto, y `500 {"error":"Error interno"}` si revientan (en ese caso NO envían heartbeat → healthchecks.io alertará).

---

## 6. Alertas de Sentry

La captura ya funciona (SDK integrado, DSN en Vercel). Falta que Sentry **te avise**. ⚠️ Requiere tu cuenta:

### Regla 1 — Nuevo error en producción → email

1. https://sentry.io → **Alerts** (menú lateral) → **Create Alert**.
2. Tipo: **Issues** → Set Conditions.
3. Proyecto: el de Padel Club OS. Environment: `production` (si el selector lo ofrece).
4. **WHEN**: "A new issue is created".
5. **IF** (filtro): "The issue's level is equal to" → `error` (así los `warning` no molestan).
6. **THEN**: "Send a notification to" → tu email (Member: tú).
7. Nombre: `Nuevo error en produccion` → **Save Rule**.

### Regla 2 — Spike de eventos → email

1. **Alerts** → **Create Alert** → tipo **Issues** de nuevo (en plan gratuito; si tu plan muestra "Metric Alerts / Number of Errors", esa variante es aún mejor).
2. **WHEN**: "The issue is seen more than `50` times in `1 hour`" (ajusta el umbral cuando conozcas el volumen normal, hoy cercano a 0).
3. **THEN**: notificación a tu email.
4. Nombre: `Spike de errores` → **Save Rule**.

Consejo: en **Settings → Notifications** de tu usuario Sentry, verifica que los "Issue Alerts" llegan por email.

---

## 7. Cold start (~1,5 s en la primera petición)

**Causa**: doble frío — (a) el compute de Neon se autosuspende a los 5 min de inactividad y tarda ~500 ms-1 s en despertar; (b) la función serverless de Vercel también arranca en frío.

**Mitigación implementada**: el monitor de UptimeRobot (sección 1) hace GET a `/api/health` cada 5 min → mantiene el compute de Neon despierto y la función caliente la mayor parte del tiempo. Coste: 0 €. No es perfecto (con intervalo exactamente de 5 min puede colarse alguna suspensión ocasional), pero elimina el problema para la práctica totalidad de las visitas.

**Alternativas de pago (futuro, no implementar aún)**:
- **Neon Launch (~19 US$/mes)**: configurar el autosuspend (alargarlo o desactivarlo) → la DB nunca duerme. La opción más directa.
- **BetterStack**: checks cada 30 s → keep-warm mucho más agresivo + mejor alerting. Complementario.
- **Vercel Pro**: no elimina el cold start por sí solo, pero lo necesitaremos igualmente por términos de uso (sección 8).

---

## 8. Vercel Hobby vs Pro — análisis honesto

**Lo que ya estamos rozando en Hobby:**

| Límite Hobby | Estado actual |
|---|---|
| **Máx. 2 cron jobs, solo diarios** | Ya usamos los 2. El tercer cron (p. ej. recordatorios más frecuentes que 1/día, digest semanal) es imposible sin Pro. Los recordatorios "1 h antes" en realidad solo salen para reservas de la franja posterior a las 7:00 UTC del día — con Pro se podría ejecutar cada hora. |
| **maxDuration 60 s (tope)** | Ya al límite en el generador de demos (`maxDuration 60`). Pro llega a 300 s. |
| **Hora de cron no garantizada** | Mitigado con grace 6 h en healthchecks.io; en Pro es más preciso. |
| **100 GB de ancho de banda/mes, optimización de imágenes limitada (~1k imágenes fuente/mes)** | De sobra hoy; con decenas de clubes activos y fotos/banners, se acerca. |
| **Sin miembros de equipo** | Irrelevante mientras seas solo tú. |

**El punto clave — términos de uso**: el plan Hobby de Vercel es **solo para uso personal y no comercial** ([vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby)). Un SaaS que cobra suscripciones a clubes es uso comercial sin ambigüedad. Vercel puede suspender el proyecto por esto, y no quieres descubrirlo con clientes de pago dentro.

**Recomendación concreta**: mantener Hobby mientras todo sea demo/pilotos gratuitos (uso no comercial de facto). **En el momento en que el primer club pague** (o firmes un piloto con compromiso de pago), pasar a **Pro (~20 US$/mes)** ese mismo día — es el primer coste fijo real y queda cubierto por menos de la mitad de una suscripción Starter (19 €). Con Pro, además: cron horario para recordatorios (mejora real de producto), maxDuration 300 s y margen de banda ancha. La migración es un clic (Settings → cambiar plan), sin downtime ni cambios de código.

---

*Última actualización: 2026-07-22 (Bloque 2 — operación en producción). Código relacionado: `src/lib/heartbeat.ts`, `src/app/api/health/route.ts`, `src/app/api/cron/*`.*
