# Stripe: checklist de paso a LIVE y runbook

Este documento no autoriza ni ejecuta el paso a LIVE. La activacion fiscal, la cuenta
Stripe LIVE y Stripe Connect LIVE quedan pendientes hasta que exista el primer cliente
de pago y el owner este dado de alta para facturar.

## 1. Precondiciones

- [ ] Owner dado de alta fiscalmente y con criterio contable/fiscal confirmado.
- [ ] Cuenta Stripe principal activada para cobros LIVE; identidad, cuenta bancaria,
  soporte, descriptor y branding revisados.
- [ ] Condiciones, privacidad, politica de cancelacion y precios publicados coinciden
  con lo que ve el cliente en Checkout.
- [ ] Decidir si el cambio de plan se prorratea inmediatamente. En TEST se valido
  `always_invoice`; no copiar esa decision a LIVE sin confirmacion de producto.
- [x] Trial unico por club: Checkout hereda `Club.trialEndsAt` mediante `trial_end`
  solo si quedan mas de 48 horas y nunca hubo suscripcion. Con el trial agotado,
  menos de 48 horas restantes o una suscripcion anterior/cancelada, cobra de inmediato.
  Validado en Stripe TEST para alta, trial caducado y recontratacion cancelada.
- [ ] Mantener Preview/Development de Vercel con claves `sk_test` y prices de TEST.
  Nunca mezclar IDs `price_...` entre modos.

## 2. Catalogo LIVE y Customer Portal

- [ ] Crear tres productos/precios recurrentes mensuales en EUR:
  Starter 19 EUR, Pro 49 EUR y Enterprise 99 EUR.
- [ ] Guardar los tres IDs LIVE; no reutilizar los IDs de TEST.
- [ ] En **Settings > Billing > Customer portal** de Stripe LIVE:
  - habilitar cambio de plan (`Switch plan`);
  - ofrecer exactamente los tres productos/precios LIVE;
  - configurar la politica acordada de prorrateo;
  - permitir actualizar el metodo de pago;
  - mantener cancelacion al final del periodo salvo decision distinta;
  - revisar el texto, datos de soporte, terminos y privacidad.

Stripe mantiene desactivado el cambio de plan por defecto; debe configurarse
expresamente. Referencia: [configurar Customer Portal](https://docs.stripe.com/customer-management/configure-portal).
El minimo de 48 horas para `trial_end` procede de la
[API de Checkout Sessions](https://docs.stripe.com/api/checkout/sessions/create#checkout_session_create-subscription_data-trial_end).

## 3. Webhook de produccion

- [ ] Crear en Stripe Workbench un webhook HTTPS con endpoint exacto:
  `https://padelclubos.com/api/stripe/webhook`.
- [ ] Suscribir solamente los eventos que procesa actualmente la aplicacion:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `customer.subscription.trial_will_end`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `charge.refunded`
- [ ] Copiar el signing secret LIVE de ese endpoint (`whsec_...`) a Vercel. Un
  signing secret de Stripe CLI o de TEST no sirve en produccion.
- [ ] Confirmar firma valida y respuestas 2xx en Workbench; reenviar manualmente un
  evento fallido despues de corregir la causa.

Stripe recomienda sincronizar suscripciones por webhook porque sus cambios son
asincronos. Referencia: [webhooks de suscripciones](https://docs.stripe.com/billing/subscriptions/webhooks).

## 4. Variables de produccion en Vercel

Configurar solo en el entorno **Production**:

- [ ] `STRIPE_SECRET_KEY=sk_live_...`
- [ ] `STRIPE_WEBHOOK_SECRET=whsec_...` del endpoint de produccion
- [ ] `STRIPE_PRICE_STARTER_MONTHLY=price_...` LIVE
- [ ] `STRIPE_PRICE_PRO_MONTHLY=price_...` LIVE
- [ ] `STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...` LIVE
- [ ] `NEXTAUTH_URL=https://padelclubos.com`

No se necesita publishable key mientras se mantenga Stripe Hosted Checkout. Tras
cambiar variables, redeploy y verificar `/api/health` antes de cualquier cobro.

## 5. Stripe Connect LIVE (pendiente para el primer cliente)

- [ ] No iniciar este bloque antes del alta fiscal del owner y la autorizacion para
  cobrar al primer cliente.
- [ ] Activar la plataforma Stripe Connect en LIVE y completar el perfil de
  plataforma, datos de soporte, branding, cuenta bancaria y terminos de servicio.
- [ ] La integracion actual crea cuentas Express con Accounts v1. Habilitar
  explicitamente **Accounts v1 support** en LIVE o planificar y probar por separado
  una migracion completa a Accounts v2; no mezclar ambas decisiones durante el
  primer go-live.
- [ ] Confirmar el modelo de destination charges y la responsabilidad por saldos
  negativos, refunds y disputas de la plataforma.
- [ ] Desde Padel Club OS, crear la cuenta Express del club real y dejar que su
  representante complete el onboarding; nunca rellenarlo por el club.
- [ ] No habilitar `bookingPaymentMode="online"` hasta que Stripe devuelva a la vez:
  `details_submitted=true`, `charges_enabled=true` y `payouts_enabled=true`.
- [ ] Ejecutar un cobro real de importe minimo autorizado y comprobar Checkout,
  `Payment`, transferencia al club y `application_fee_amount` del 5 %.
- [ ] Ejecutar un refund autorizado y comprobar la reversa del transfer y el estado
  final en DB antes de abrir pagos al resto de clubes.

En destination charges, Stripe carga las disputas a la plataforma. Referencia:
[destination charges](https://docs.stripe.com/connect/destination-charges). Stripe
permite continuar una integracion v1 si no necesita las funciones de Accounts v2:
[guia de migracion gradual](https://docs.stripe.com/connect/accounts-v2/migrate-integration).

## 6. Stripe Tax y datos fiscales (codigo preparado; alta externa pendiente)

- [x] Checkout SaaS recopila domicilio, razon social y NIF/VAT ID y actualiza el Customer.
- [x] `STRIPE_TAX_ENABLED` controla `automatic_tax` sin cambios de codigo.
- [x] Textos legales, precios sin IVA y aceptacion versionada implementados.
- [ ] Completar identidad fiscal, registro(s) de IVA y configuracion de facturas en
  Stripe TEST siguiendo `docs/legal-y-facturacion-go-live.md`.
- [ ] Asignar `txcd_10103001` a los tres productos y `tax_behavior=exclusive` a sus prices.
- [ ] Validar facturas y abonos en TEST; solo despues repetir en LIVE y activar
  `STRIPE_TAX_ENABLED=true` en Production.
- [ ] Mantener separada la obligacion fiscal del SaaS de la de los clubes en Connect.

## Runbook operativo

### Disputa de una reserva

1. Abrir la disputa en Stripe Dashboard y localizar el `PaymentIntent`.
2. Buscar ese ID en `Payment.stripePaymentId`; recopilar reserva, jugador, pista,
   fecha/hora, importe, confirmacion, politica de cancelacion y comunicaciones.
3. Decidir aceptar o responder. Para responder, presentar una cronologia breve y
   solo evidencia relevante; Stripe permite una unica entrega de evidencia.
4. Vigilar el saldo de plataforma: en destination charges, importe y tasas de disputa
   se cargan a la plataforma.
5. Registrar la resolucion fuera de Stripe hasta que exista automatizacion de
   `charge.dispute.*` en la aplicacion.

Referencias: [responder disputas](https://docs.stripe.com/disputes/responding) y
[buenas practicas de evidencia](https://docs.stripe.com/disputes/best-practices).

### Refund manual de una reserva

1. Preferir la cancelacion del jugador en la aplicacion: aplica la politica horaria,
   cancela la reserva y sincroniza DB.
2. Si hay que hacerlo manualmente, identificar el `PaymentIntent` correcto y crear
   el refund con `reverse_transfer=true` para recuperar del club el importe
   transferido. La politica actual usa `refund_application_fee=false`: la plataforma
   devuelve al jugador el total y absorbe su comision del 5 %.
3. Comprobar el evento `charge.refunded` 2xx y los estados:
   `Payment.status="refunded"`, `Booking.paymentStatus="refunded"` y pagos por
   jugador sincronizados.
4. Si el webhook fallo, corregir la causa y reenviar el evento desde Workbench; no
   crear un segundo refund.

Stripe deja por defecto los fondos en la cuenta conectada; por eso la reversa del
transfer es obligatoria para esta politica. Referencia: [refunds de destination
charges](https://docs.stripe.com/connect/destination-charges#issue-refunds).

### Impago

**Suscripcion SaaS**

1. `invoice.payment_failed` cambia el club a `past_due` y bloquea las operaciones
   protegidas.
2. Pedir al admin que actualice el metodo de pago en Customer Portal.
3. Reintentar/cobrar la factura desde Stripe segun la politica de Smart Retries.
4. Confirmar `invoice.paid`/`customer.subscription.updated` con 2xx y que DB vuelve a
   estado activo antes de dar el incidente por cerrado.

**Reserva online**

1. Checkout dispone de 15 minutos. El cron `booking-reminders` cancela reservas
   `online + pending` antiguas, expira la Checkout Session y libera el slot.
2. Revisar que el cron de Vercel responde 2xx y que `canceladasPorPago` aumenta.
3. Si el cron fallo, invocarlo una vez con `Authorization: Bearer $CRON_SECRET` y
   comprobar en Stripe que la sesion quedo `expired` y en DB la reserva `cancelled`.
4. Si entra un pago despues de una cancelacion, el webhook emite refund con reversa
   del transfer; verificarlo antes de intervenir manualmente.
