# Legal y facturación: checklist para empezar a cobrar

Actualizado: 22 de julio de 2026.

Este documento separa lo que ya queda resuelto en la aplicación de las decisiones y
altas que pertenecen al titular del negocio. Los textos publicados son una base
operativa adaptada al producto; no sustituyen el alta fiscal ni pueden inventar la
identidad de quien factura.

## 1. Implementado en la aplicación

- `/aviso-legal`: identificación del prestador y reglas del sitio.
- `/terminos`: contrato de suscripción SaaS exclusivamente B2B.
- `/acuerdo-tratamiento-datos`: DPA conforme al artículo 28 RGPD, con anexos de
  tratamientos, medidas y subencargados.
- `/privacidad`: distingue a Padel Club OS como responsable de sus datos propios y
  como encargado de los datos gestionados por cada club.
- `/cookies`: inventario real de cookies y almacenamiento local actual.
- `/pago-seguro`: separa suscripciones SaaS y cobros de reservas mediante Connect.
- Registro y Checkout exigen aceptación expresa y guardan la versión aceptada en
  `LegalAcceptance`.
- Checkout recopila razón social, domicilio y NIF/VAT ID cuando el país lo soporta.
- `STRIPE_TAX_ENABLED` permite activar el cálculo automático sin cambiar código.
- Los precios visibles indican que el IVA no está incluido.

No existe página de «Envío» porque no se venden bienes físicos. La activación y
prestación electrónica están reguladas en las condiciones SaaS.

## 2. Bloqueantes antes del primer cobro real

- [ ] El titular está dado de alta para desarrollar la actividad y emitir facturas.
- [ ] Se ha decidido quién factura: persona autónoma o sociedad. La marca «Padel
  Club OS» no sustituye el nombre/razón social ni el NIF.
- [ ] Configurar en Vercel Production y Preview, según corresponda:
  - `LEGAL_NAME`
  - `LEGAL_TAX_ID`
  - `LEGAL_ADDRESS`
  - `LEGAL_REGISTRY_DETAILS` (solo si corresponde)
  - `LEGAL_EMAIL`
- [ ] Hacer redeploy y comprobar que `/aviso-legal`, `/privacidad`, `/terminos` y el
  DPA no muestran el aviso ámbar de datos pendientes.
- [ ] Revisar que la entidad, domicilio y NIF coinciden exactamente en Stripe, en
  las páginas legales y en el alta fiscal.
- [ ] Aplicar la migración `20260722190000_add_legal_acceptances` en el entorno de
  destino antes de desplegar el código que registra aceptaciones.

Referencias: el artículo 10 LSSI exige que la identidad y el contacto sean accesibles
de forma permanente, fácil, directa y gratuita; los artículos 27 y 28 regulan la
información y confirmación de la contratación electrónica:
https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758

## 3. Stripe Tax en TEST

El código está preparado, pero Tax no debe activarse a ciegas. Primero:

1. Stripe TEST → Tax → Settings:
   - indicar como origen la dirección fiscal real;
   - añadir el registro de IVA de España con la fecha real de efecto;
   - seleccionar precios exclusivos de impuestos.
2. En cada producto Starter, Pro y Enterprise, asignar el código fiscal
   `txcd_10103001` («Software as a service (SaaS) - business use»).
3. En los prices, usar `tax_behavior=exclusive`. Si un price existente no permite
   corregirlo, crear uno nuevo y actualizar la variable `STRIPE_PRICE_*`.
4. Stripe → Settings → Billing → Invoices:
   - añadir el NIF del emisor como identificador fiscal predeterminado;
   - completar nombre legal, domicilio, email/web de soporte y branding;
   - elegir numeración de cuenta y un prefijo adecuado;
   - añadir al pie los datos registrales que correspondan;
   - previsualizar el PDF en A4.
5. Customer Portal:
   - permitir actualizar dirección de facturación, NIF y método de pago;
   - configurar las URLs públicas de términos y privacidad.
6. Poner `STRIPE_TAX_ENABLED=true` solo en TEST y redeploy.
7. Probar como mínimo:
   - club español con NIF y dirección peninsular;
   - club de otro país de la UE con VAT ID válido;
   - Canarias, Ceuta o Melilla, que Stripe trata fuera del cálculo estándar de IVA
     español;
   - factura, abono/reembolso y renovación mensual.
8. Verificar en cada PDF: numeración, fecha, emisor y destinatario completos, NIF,
   domicilios, descripción, base, tipo, cuota e importe total.

Stripe documenta la dirección y `customer_update[address]=auto` para Tax, y la
recogida de identificadores fiscales en Checkout:

- https://docs.stripe.com/tax/checkout
- https://docs.stripe.com/tax/checkout/tax-ids
- https://docs.stripe.com/tax/tax-codes
- https://docs.stripe.com/invoicing/customize

La AEAT enumera el contenido obligatorio de una factura completa:
https://sede.agenciatributaria.gob.es/Sede/iva/facturacion-registro/facturacion-iva/contenido-facturas.html

## 4. Paso a LIVE

- [ ] Repetir en LIVE la configuración validada en TEST; TEST y LIVE tienen
  productos, prices, registros fiscales e invoice settings separados.
- [ ] Confirmar que `STRIPE_TAX_ENABLED=true` solo se despliega después de crear el
  registro fiscal LIVE y revisar los tres productos LIVE.
- [ ] Crear un Checkout real autorizado y descargar su primera factura.
- [ ] No abrir ventas hasta que esa factura se haya cotejado campo por campo con la
  sección anterior.
- [ ] Conservar las facturas y abonos en el sistema contable del titular. Stripe es
  el medio material de emisión, pero el responsable de la factura sigue siendo el
  empresario o profesional que presta el SaaS.

## 5. Stripe Connect y facturas de reservas

La plataforma no debe emitir como propia la factura del alquiler de pista. En el
modelo actual de destination charges:

- el club presta el servicio deportivo y fija sus condiciones;
- el club debe emitir al jugador el documento fiscal que corresponda;
- Padel Club OS factura al club la suscripción SaaS y, cuando proceda, su comisión;
- Stripe Connect no decide por sí solo quién es el obligado tributario.

Antes de activar reservas LIVE, documentar en el onboarding del club que sus datos
de Connect son los del prestador real y que acepta su responsabilidad por precios,
cancelaciones, impuestos y facturación a jugadores.

Referencia de Stripe sobre la necesidad de determinar primero qué entidad tiene la
obligación fiscal en Connect: https://docs.stripe.com/tax/connect

## 6. RGPD operativo que las páginas no resuelven por sí solas

- [ ] Firmar/aceptar el DPA con cada club; el clickwrap y `LegalAcceptance` aportan
  evidencia, pero una orden de servicio firmada puede usarse para clientes grandes.
- [ ] Mantener actualizada la tabla de subencargados y avisar cambios con antelación.
- [ ] Documentar internamente el registro de actividades de tratamiento.
- [ ] Definir y probar un procedimiento de brechas: responsable, evaluación,
  comunicación al club sin dilación indebida y, cuando proceda, notificación a AEPD.
- [ ] Verificar región y garantías internacionales de Vercel, Neon, Resend, Stripe,
  Sentry y Upstash según la configuración realmente contratada.
- [ ] No permitir datos de salud o categorías especiales en notas libres sin una
  evaluación y medidas adicionales.

La AEPD exige formalizar la relación responsable-encargado y advierte que no basta
una remisión genérica al RGPD:
https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/8-responsable-y-encargado-del-tratamiento

## 7. Calendario fiscal 2027 que hay que preparar

Stripe PDF resuelve el documento legible, pero no se debe asumir que por sí solo
cubre los futuros requisitos españoles de sistemas informáticos de facturación.

- Sistemas de facturación adaptados al RD 1007/2023: fecha publicada de 1 de enero
  de 2027 para obligados del artículo 3.1.a) y 1 de julio de 2027 para el resto.
- Factura electrónica B2B: el RD 238/2026 prevé aplicación 12 o 24 meses después de
  la orden ministerial correspondiente, según volumen de operaciones.

Antes de esas fechas, elegir una solución contable/fiscal compatible con VERI*FACTU
y factura electrónica, o validar que la integración elegida con Stripe exporta los
datos necesarios. Fuentes oficiales:

- https://www.boe.es/buscar/act.php?id=BOE-A-2023-24840
- https://sede.agenciatributaria.gob.es/Sede/todas-noticias/2026/marzo/31/facturacion-electronica-obligatoria.html
