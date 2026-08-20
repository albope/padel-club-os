# Stripe: checklist de paso a LIVE y runbook

Este documento no autoriza ni ejecuta el paso a LIVE. BORT PEREZ MULTI GESTION
SOCIEDAD LIMITADA será quien facture la suscripción SaaS. La cuenta Stripe LIVE
se configurará mediante una sesión guiada antes del primer cobro real.

## 1. Precondiciones

- [x] Sociedad emisora, identidad legal y flujo contable definidos. Las facturas
  se entregarán mensualmente a la gestoría.
- [ ] Cuenta Stripe principal activada para cobros LIVE. Identidad, cuenta bancaria,
  soporte, descriptor y branding revisados.
- [ ] Condiciones, privacidad, politica de cancelacion y precios publicados coinciden
  con lo que ve el cliente en Checkout.
- [x] Política de cambios de plan confirmada: las subidas se aplican
  inmediatamente y cobran la diferencia proporcional. Las bajadas se programan
  para la siguiente renovación mensual.
- [x] Trial unico por club: Checkout hereda `Club.trialEndsAt` mediante `trial_end`
  solo si quedan mas de 48 horas y nunca hubo suscripcion. Con el trial agotado,
  menos de 48 horas restantes o una suscripcion anterior/cancelada, cobra de inmediato.
  Validado en Stripe TEST para alta, trial caducado y recontratacion cancelada.
- [ ] Mantener Preview/Development de Vercel con claves `sk_test` y prices de TEST.
  Nunca mezclar IDs `price_...` entre modos.

## 2. Catalogo LIVE y Customer Portal

- [ ] Crear tres productos/precios recurrentes mensuales en EUR:
  Starter 19 EUR, Pro 49 EUR y Enterprise 99 EUR.
- [ ] Guardar los tres IDs LIVE. No reutilizar los IDs de TEST.

No se publican precios anuales ni se crean Price IDs anuales durante el
lanzamiento inicial. Mantener una sola periodicidad reduce configuración,
soporte, conciliación y posibles discrepancias entre landing y Checkout.

- [ ] En **Settings > Billing > Customer portal** de Stripe LIVE:
  - habilitar cambio de plan (`Switch plan`)
  - ofrecer exactamente los tres productos y precios LIVE
  - facturar inmediatamente el prorrateo de las subidas
  - programar las bajadas para el final del periodo mensual
  - permitir actualizar el metodo de pago
  - mantener cancelacion al final del periodo salvo decision distinta
  - revisar el texto, datos de soporte, terminos y privacidad.
- [ ] Copiar el ID `bpc_...` de esa configuración a
  `STRIPE_PORTAL_CONFIGURATION_ID`. TEST y LIVE deben usar configuraciones distintas.

Stripe mantiene desactivado el cambio de plan por defecto. Debe configurarse
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
- [ ] Confirmar firma valida y respuestas 2xx en Workbench. Reenviar manualmente un
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
- [ ] `STRIPE_PORTAL_CONFIGURATION_ID=bpc_...` LIVE
- [ ] `NEXTAUTH_URL=https://padelclubos.com`

No se necesita publishable key mientras se mantenga Stripe Hosted Checkout. Tras
cambiar variables, redeploy y verificar `/api/health` antes de cualquier cobro.

## 5. Pagos de reservas

Stripe Connect está retirado del producto. Las reservas nuevas se crean siempre con
`paymentMethod="presential"` y el cobro lo gestiona directamente el club. Los
campos, webhooks y reembolsos Connect se conservan temporalmente solo para
reconciliar datos históricos. No deben configurarse cuentas Connect nuevas.

## 6. Stripe Tax y datos fiscales (código preparado, alta externa pendiente)

- [x] Checkout SaaS recopila domicilio, razon social y NIF/VAT ID y actualiza el Customer.
- [x] `STRIPE_TAX_ENABLED` controla `automatic_tax` sin cambios de codigo.
- [x] Textos legales, precios sin IVA y aceptacion versionada implementados.
- [ ] Completar identidad fiscal, registro(s) de IVA y configuracion de facturas en
  Stripe TEST siguiendo `docs/legal-y-facturacion-go-live.md`.
- [ ] Asignar `txcd_10103001` a los tres productos y `tax_behavior=exclusive` a sus prices.
- [ ] Validar facturas y abonos en TEST. Solo después repetir en LIVE y activar
  `STRIPE_TAX_ENABLED=true` en Production.
- [ ] Mantener separada la obligación fiscal del SaaS de la de las reservas que cobra cada club.
- [ ] Configurar la emisión de facturas a nombre de la sociedad y comprobar la
  exportación mensual que se entregará a la gestoría.

## Runbook operativo

### Impago

**Suscripcion SaaS**

1. `invoice.payment_failed` cambia el club a `past_due` y bloquea las operaciones
   protegidas.
2. Pedir al admin que actualice el metodo de pago en Customer Portal.
3. Reintentar/cobrar la factura desde Stripe segun la politica de Smart Retries.
4. Confirmar `invoice.paid`/`customer.subscription.updated` con 2xx y que DB vuelve a
   estado activo antes de dar el incidente por cerrado.

Las reservas presenciales pendientes no caducan por falta de pago online. El club
debe registrar el cobro o aplicar su política de cancelación desde el panel.
