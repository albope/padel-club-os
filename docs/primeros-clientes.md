# Operación de los primeros clientes

Checklist práctico para vender, dar de alta, acompañar y dar de baja a los dos
primeros clubes sin depender de conocimiento informal.

## Estrategia de lanzamiento ligero

Para salir rápido sin crear dos sistemas de cobro:

1. demo y piloto inicial sin cargo mientras se valida el encaje;
2. alta censal y criterio fiscal confirmados antes del primer cobro;
3. suscripción SaaS exclusivamente mensual mediante Stripe Checkout;
4. sin permanencia, anualidades, descuentos manuales ni cobros de reservas;
5. alta, restauración demo, emails, crons y seguimiento operados desde la
   plataforma siempre que exista automatización segura.

Una transferencia o factura manual puede resolver una excepción puntual, pero no
debe convertirse en otro flujo del producto. La fuente de verdad de las
suscripciones de pago será Stripe cuando se active LIVE.

## 1. Antes de enviar una demo

- Confirmar que `/api/health` responde 200 y `/api/ready` responde 200.
- Ejecutar `npm run release:verify` sobre el mismo SHA desplegado.
- Restaurar el club demo desde Plataforma → Clubes → Restaurar datos demo.
- Guardar las nuevas credenciales en el gestor de contraseñas; no enviarlas junto
  con enlaces internos ni reutilizarlas para clientes reales.
- Probar `/login`, el dashboard administrador, el portal del jugador y
  `/dashboard/accesos`.
- Confirmar que la demo está marcada como demo, no envía correo real y no permite
  pagos de reservas.

## 2. Propuesta comercial mínima

La propuesta debe indicar por escrito:

- identidad del prestador y del club;
- plan, precio neto, IVA aplicable, forma y periodicidad de pago;
- alcance incluido: alta, importación inicial, formación y soporte;
- fecha objetivo, dependencias del club y criterio de aceptación;
- duración, renovación, cancelación y tratamiento de datos;
- exclusiones expresas, especialmente hardware, TPV y cobros de reservas;
- enlace a Condiciones SaaS, DPA, privacidad y aviso legal.

No prometer funciones futuras como parte del precio actual. Cualquier excepción o
desarrollo a medida debe figurar como anexo con coste, fecha y aceptación propios.

## 3. Alta y go-live por club

- [ ] Orden/propuesta aceptada y DPA aceptado.
- [ ] Contacto responsable y suplente identificados.
- [ ] Nombre, slug, zona horaria, horarios y política de cancelación confirmados.
- [ ] Logo, portada, color y datos de contacto cargados.
- [ ] Pistas, tarifas, bloqueos, personal y socios importados.
- [ ] Importación validada por totales y una muestra de diez registros.
- [ ] Roles de admin y staff revisados; accesos temporales eliminados.
- [ ] Club publicado y registro de jugadores configurado.
- [ ] Reserva admin, reserva jugador, cancelación y cobro presencial probados.
- [ ] Email, push, exportación y reporte de incidencia probados.
- [ ] Formación de 60 minutos completada y grabación/guía entregada.
- [ ] Responsable del club confirma por escrito el go-live.
- [ ] Snapshot previo, SHA, hora de salida y resultado del smoke documentados.

## 4. Formación

Sesión recomendada:

1. configuración, pistas y tarifas;
2. reservas, bloqueos, recurrentes y cobro presencial;
3. socios, importación, roles y activaciones;
4. portal de jugador, partidas y competiciones;
5. comunicación, analítica y exportaciones;
6. soporte, reportes, privacidad y recuperación de acceso.

Durante la primera semana, hacer una revisión a las 24 horas y otra a los siete
días. Registrar dudas repetidas como oportunidades de onboarding, no como
conocimiento privado del operador.

## 5. Soporte

Canal inicial: `LEGAL_EMAIL`/`CONTACT_EMAIL` y el widget contextual. Horario
laborable recomendado: lunes a viernes, 09:00–18:00 Europe/Madrid.

| Prioridad | Ejemplo | Primera respuesta objetivo |
|---|---|---:|
| P0 | caída total, fuga de datos o reservas imposibles | 1 hora laborable |
| P1 | función crítica degradada sin alternativa | 4 horas laborables |
| P2 | error con alternativa o datos corregibles | 1 día laborable |
| P3 | consulta, mejora o incidencia cosmética | 2 días laborables |

Estos tiempos son objetivos de soporte, no una garantía de resolución. Toda
incidencia debe tener responsable, estado, impacto, cronología y cierre.

## 6. Baja, exportación y borrado

1. verificar identidad y autoridad del solicitante;
2. confirmar fecha efectiva y detener renovaciones;
3. exportar socios y reservas y entregar por canal seguro;
4. revocar sesiones, staff, integraciones y accesos de soporte;
5. conservar solo datos exigidos por obligaciones legales o defensa de
   reclamaciones, con acceso restringido;
6. borrar o anonimizar el resto según DPA/condiciones;
7. documentar qué se borró, qué se retuvo, fundamento y fecha de eliminación;
8. confirmar el cierre al club.

Política operativa inicial para validar con asesoría:

- auditoría de seguridad/operación: 24 meses;
- reportes de producto: 12 meses tras su cierre;
- leads no convertidos: 12 meses desde la última interacción;
- copias: siete días de copias diarias incluidas, sin usarlas como archivo permanente;
- evidencias contractuales y facturas: plazo legal aplicable.

## 7. Continuidad e incidentes

- Objetivo inicial RPO: 24 horas; objetivo RTO: 8 horas laborables.
- Antes de cada migración/importación: volcado lógico cifrado recuperable.
- Trimestralmente: restaurar una copia en un proyecto aislado, validar usuarios,
  membresías, reservas y auditoría, y medir el tiempo real.
- Para P0: contener, conservar evidencia, comunicar al responsable, recuperar,
  validar aislamiento de dos clubes y redactar retrospectiva.

No anunciar RPO/RTO contractuales mejores que la capacidad real de Supabase Pro
sin PITR, Vercel y el equipo de soporte.

## 8. Métricas de los dos primeros clubes

Revisar semanalmente:

- tiempo de alta y porcentaje del onboarding completado;
- administradores y jugadores activados;
- reservas creadas, canceladas y ocupación por pista;
- porcentaje de reservas con cobro presencial registrado;
- usuarios activos a 7 y 30 días;
- reportes por categoría, tiempo de primera respuesta y reaperturas;
- funciones usadas, tareas que vuelven a Excel/WhatsApp y motivos de abandono.

Entrevista breve en semanas 1, 3 y 6. Priorizar problemas repetidos por ambos
clubes antes que peticiones aisladas de personalización.

## 9. Límites legales y fiscales

La sociedad emisora, NIF, domicilio público, datos registrales y email ya están
definidos. Antes del primer cobro deben copiarse a Vercel y comprobarse en las
páginas públicas. La sociedad emitirá las facturas SaaS y entregará mensualmente
las facturas y abonos a su gestoría.

El Aviso legal necesita un domicilio accesible públicamente. Si no se desea
publicar el domicilio fiscal, debe existir antes del cobro un domicilio
profesional o servicio de domiciliación válido y configurar
`LEGAL_PUBLIC_ADDRESS`. El dato no se guarda en Git.
