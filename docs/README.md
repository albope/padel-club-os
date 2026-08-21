# Documentación operativa de PadelClub OS

**Estado consolidado:** 21 de agosto de 2026

Este índice separa los documentos que determinan la salida a producción de los
materiales de referencia. El objetivo actual es dejar el producto listo para
producción y para un piloto controlado, manteniendo Stripe LIVE como última fase.

## Fuente de verdad para salir a producción sin Stripe

1. [`checklist-lanzamiento.md`](checklist-lanzamiento.md): puertas de salida y
   estado maestro.
2. [`supabase-go-live.md`](supabase-go-live.md): base de datos, credenciales,
   seed, copias y restauración.
3. [`operacion.md`](operacion.md): despliegue, crons, incidentes y observabilidad.
4. [`entregabilidad-email.md`](entregabilidad-email.md): Resend, SPF, DKIM y
   DMARC.
5. [`primeros-clientes.md`](primeros-clientes.md): onboarding y operación de
   los dos primeros clubes.

`production-readiness.md` conserva la auditoría técnica del código. No sustituye
al checklist maestro ni demuestra por sí solo que los servicios externos estén
configurados.

## Fase final diferida

- [`stripe-go-live.md`](stripe-go-live.md)
- [`legal-y-facturacion-go-live.md`](legal-y-facturacion-go-live.md)

Ambos documentos siguen vigentes, pero sus tareas de Stripe no bloquean el
objetivo intermedio de producción técnica y piloto sin cobros LIVE. Sí deben
cerrarse antes del primer cobro de una suscripción SaaS.

## Producto, diseño y evolución

- [`identidad-marcador.md`](identidad-marcador.md): estado y gates visuales.
- [`PROMPT-MAESTRO-IDENTIDAD-VISUAL.md`](PROMPT-MAESTRO-IDENTIDAD-VISUAL.md):
  brief histórico de diseño, no runbook operativo.
- [`checklist-mejoras-sin-stripe.md`](checklist-mejoras-sin-stripe.md): backlog
  priorizado posterior al núcleo de lanzamiento.

## Regla de mantenimiento

No marcar una tarea externa como terminada por inferencia. Registrar fecha,
servicio y evidencia verificable. Nunca guardar credenciales, URLs con
contraseña, tokens ni claves en `docs` o en Git.
