# Legal y facturación: checklist para empezar a cobrar

Actualizado: 20 de agosto de 2026.

Este documento separa lo que ya queda resuelto en la aplicación de las decisiones y
altas que pertenecen al titular del negocio. Los textos publicados son una base
operativa adaptada al producto. No sustituyen el alta fiscal ni pueden inventar la
identidad de quien factura.

## 1. Implementado en la aplicación

- `/aviso-legal`: identificación del prestador y reglas del sitio.
- `/terminos`: contrato de suscripción SaaS exclusivamente B2B.
- `/acuerdo-tratamiento-datos`: DPA conforme al artículo 28 RGPD, con anexos de
  tratamientos, medidas y subencargados.
- `/privacidad`: distingue a Padel Club OS como responsable de sus datos propios y
  como encargado de los datos gestionados por cada club.
- `/cookies`: inventario real de cookies y almacenamiento local actual.
- `/pago-seguro`: separa la suscripción SaaS de los cobros presenciales que gestiona cada club.
- Registro y Checkout exigen aceptación expresa y guardan la versión aceptada en
  `LegalAcceptance`.
- Checkout recopila razón social, domicilio y NIF/VAT ID cuando el país lo soporta.
- `STRIPE_TAX_ENABLED` permite activar el cálculo automático sin cambiar código.
- Los precios visibles indican que el IVA no está incluido.

No existe página de «Envío» porque no se venden bienes físicos. La activación y
prestación electrónica están reguladas en las condiciones SaaS.

## 2. Sociedad emisora

La suscripción SaaS la factura BORT PEREZ MULTI GESTION SOCIEDAD LIMITADA,
NIF B98629470. La marca «Padel Club OS» identifica el producto, pero no sustituye
la identidad de la sociedad en el contrato, Checkout ni las facturas.

La sociedad está inscrita en el Registro Mercantil de Valencia, tomo 9786,
libro 7068, folio 52, sección 8, hoja V-159244. Su domicilio público es Avenida
Carlos Marx, 1, 12 E, 46920 Mislata, Valencia, España. El email legal y de soporte
es `albertobort@gmail.com`.

La sociedad emitirá las facturas de suscripción y las entregará mensualmente a
su gestoría junto con los abonos o facturas rectificativas que correspondan.

## 3. Bloqueantes antes del primer cobro real

- [x] Sociedad emisora, NIF, domicilio público, registro y email confirmados.
- [x] Flujo contable confirmado: la sociedad emite las facturas y las entrega
  mensualmente a la gestoría.
- [x] Identidad legal pública incorporada por defecto a la aplicación:
  - `LEGAL_NAME`
  - `LEGAL_TAX_ID`
  - `LEGAL_PUBLIC_ADDRESS` (se muestra en el Aviso legal, no usar aquí un
    domicilio privado que no se quiera publicar)
  - `LEGAL_REGISTRY_DETAILS`
  - `LEGAL_EMAIL`
  Las variables de Vercel quedan como sobrescrituras opcionales si cambia la
  sociedad.
- [ ] Tras el próximo deploy, comprobar que `/aviso-legal`, `/privacidad`,
  `/terminos` y el DPA muestran esos datos y no el aviso ámbar.
- [ ] Revisar que la entidad, domicilio y NIF coinciden exactamente en Stripe, en
  las páginas legales y en el alta fiscal.
- [ ] Aplicar todas las migraciones hasta
  `20260725000000_presential_bookings_and_database_rate_limit` antes de desplegar.
- [ ] Establecer `TAX_HANDLING_CONFIRMED=true` en Vercel cuando la configuración
  fiscal de Stripe se haya probado y la primera factura de muestra esté validada.

Referencias: el artículo 10 LSSI exige que la identidad y el contacto sean accesibles
de forma permanente, fácil, directa y gratuita. Los artículos 27 y 28 regulan la
información y confirmación de la contratación electrónica:
https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758

## 4. Stripe Tax en TEST

El código está preparado, pero Tax no debe activarse a ciegas. Stripe Tax es una
opción técnica, no una condición legal universal ni un sustituto de asesoría. Si
se mantiene `STRIPE_TAX_ENABLED=false`, debe existir un procedimiento externo
verificado para calcular impuestos y emitir/conservar facturas. Si se usa Stripe
Tax:

1. Stripe TEST → Tax → Settings:
   - indicar como origen la dirección fiscal real
   - añadir el registro de IVA de España con la fecha real de efecto
   - seleccionar precios exclusivos de impuestos.
2. En cada producto Starter, Pro y Enterprise, asignar el código fiscal
   `txcd_10103001` («Software as a service (SaaS) - business use»).
3. En los prices, usar `tax_behavior=exclusive`. Si un price existente no permite
   corregirlo, crear uno nuevo y actualizar la variable `STRIPE_PRICE_*`.
4. Stripe → Settings → Billing → Invoices:
   - añadir el NIF del emisor como identificador fiscal predeterminado
   - completar nombre legal, domicilio, email/web de soporte y branding
   - elegir numeración de cuenta y un prefijo adecuado
   - añadir al pie los datos registrales que correspondan
   - previsualizar el PDF en A4.
5. Customer Portal:
   - permitir actualizar dirección de facturación, NIF y método de pago
   - configurar las URLs públicas de términos y privacidad.
6. Poner `STRIPE_TAX_ENABLED=true` solo en TEST y redeploy.
7. Probar como mínimo:
   - club español con NIF y dirección peninsular
   - club de otro país de la UE con VAT ID válido
   - Canarias, Ceuta o Melilla, que Stripe trata fuera del cálculo estándar de IVA
     español
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

## 5. Paso a LIVE

- [ ] Repetir en LIVE la configuración validada en TEST. TEST y LIVE tienen
  productos, prices, registros fiscales e invoice settings separados.
- [ ] Confirmar que `STRIPE_TAX_ENABLED=true` solo se despliega después de crear el
  registro fiscal LIVE y revisar los tres productos LIVE.
- [ ] Crear un Checkout real autorizado y descargar su primera factura.
- [ ] No abrir ventas hasta que esa factura se haya cotejado campo por campo con la
  sección anterior.
- [ ] Exportar cada mes las facturas y abonos de Stripe y entregarlos a la gestoría.
  Stripe es el medio material de emisión, pero la responsable de la factura sigue
  siendo la sociedad que presta el SaaS.

## 6. Facturas y cobros de reservas

La plataforma no procesa pagos de reservas. Todas las reservas nuevas se cobran
directamente en el club y Padel Club OS solo registra su estado:

- el club presta el servicio deportivo y fija sus condiciones
- el club debe emitir al jugador el documento fiscal que corresponda
- Padel Club OS factura al club únicamente la suscripción SaaS
- el club decide y gestiona el efectivo, TPV u otros medios presenciales que acepte.

El onboarding debe recordar al club su responsabilidad sobre precios,
cancelaciones, devoluciones, impuestos y facturación a jugadores.

## 7. RGPD operativo que las páginas no resuelven por sí solas

- [ ] Firmar o aceptar el DPA con cada club. El clickwrap y `LegalAcceptance` aportan
  evidencia, pero una orden de servicio firmada puede usarse para clientes grandes.
- [ ] Mantener actualizada la tabla de subencargados y avisar cambios con antelación.
- [ ] Documentar internamente el registro de actividades de tratamiento.
- [ ] Definir y probar un procedimiento de brechas: responsable, evaluación,
  comunicación al club sin dilación indebida y, cuando proceda, notificación a AEPD.
- [ ] Verificar región y garantías internacionales de Vercel, Supabase, Resend, Stripe,
  Sentry y Upstash según la configuración realmente contratada.
- [ ] No permitir datos de salud o categorías especiales en notas libres sin una
  evaluación y medidas adicionales.

La AEPD exige formalizar la relación responsable-encargado y advierte que no basta
una remisión genérica al RGPD:
https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/8-responsable-y-encargado-del-tratamiento

## 8. Calendario fiscal 2027 que hay que preparar

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
