# Checklist de mejoras de PadelClub OS sin Stripe

**Fecha de revisión:** 21 de agosto de 2026
**Alcance:** trabajo pendiente de producto, operación y lanzamiento. Quedan fuera Stripe, los cobros online y las automatizaciones que dependan de Stripe.

## P0 · Dejar el piloto listo y protegido

- [ ] Activar y comprobar MFA en todas las cuentas con acceso a producción.
- [x] Ejecutar las migraciones de Supabase, registrar el historial Prisma y
  corregir extensión e índices de claves foráneas.
- [ ] Cerrar el hardening de RLS y privilegios de los roles de Data API.
- [ ] Generar una credencial nueva del rol `prisma` después de invalidar la filtrada.
- [ ] Ejecutar el preflight y la carga de datos iniciales contra producción.
- [ ] Guardar las credenciales demo en el gestor seguro acordado.
- [ ] Completar el smoke test de los perfiles superadmin, administrador de club y jugador.
- [ ] Superar la revisión visual en 360, 768, 1024 y 1440 píxeles, en modo claro y oscuro.
- [ ] Ejecutar la primera copia de seguridad diaria y documentar una restauración aislada satisfactoria.
- [ ] Configurar las variables de producción en Vercel y desplegar exactamente el SHA validado.
- [ ] Verificar que `/api/health` y `/api/ready` responden correctamente en el dominio real.
- [ ] Completar un recorrido crítico en el dominio real con los tres perfiles.
- [ ] Validar dominio, certificado TLS, redirecciones y cabeceras de seguridad.
- [ ] Verificar el dominio de Resend y completar un envío real controlado.
- [ ] Configurar Blob si se habilitan adjuntos, VAPID si se activan notificaciones y Sentry en producción.
- [ ] Añadir monitorización externa de disponibilidad y heartbeats de los procesos programados.
- [ ] Asegurar un programador con frecuencia suficiente para recordatorios y tareas operativas.

## P1 · Operar de verdad con los dos primeros clubes

- [ ] Ejecutar el onboarding completo de un club real y registrar tiempo, dudas y bloqueos.
- [ ] Importar datos reales y reconciliar totales más una muestra manual de al menos diez registros.
- [ ] Validar permisos y visibilidad para propietarios, recepción, entrenadores y jugadores.
- [ ] Publicar y probar el portal del jugador con la identidad visual del club piloto.
- [ ] Completar reservas, cancelaciones, listas de espera, partidos abiertos, ligas y torneos de extremo a extremo.
- [ ] Impartir una formación inicial de 60 minutos y recoger la aceptación de salida a producción.
- [ ] Hacer revisiones de operación a las 24 horas y a los 7 días.
- [ ] Entrevistar a los usuarios en las semanas 1, 3 y 6 y convertir los hallazgos en decisiones priorizadas.
- [ ] Definir una rutina de soporte con responsable, tiempos de respuesta y registro de incidencias.
- [ ] Mejorar el calendario de recepción con actualización en tiempo real, arrastrar y soltar, y explicación inmediata de conflictos.
- [ ] Completar el módulo de escuela con entrenadores, grupos, recurrencia, asistencia, sustituciones, niveles y lista de espera.
- [ ] Añadir socios, bonos, cuotas internas y relaciones familiares o de tutores, sin depender de una pasarela de pago.
- [ ] Incorporar segmentación CRM y automatizaciones de comunicación por ciclo de vida.
- [ ] Evaluar WhatsApp Business y SMS para comunicaciones operativas, con consentimiento y trazabilidad.
- [ ] Ampliar la migración para histórico de reservas, bonos activos, saldos, socios y cuotas.
- [ ] Generar un informe de conciliación y una vía de reversión para cada importación.
- [ ] Crear un centro de ayuda, recorridos guiados y microtutoriales contextuales para usuarios no técnicos.
- [ ] Medir finalización del onboarding y puntos de abandono.
- [ ] Ampliar analítica con origen de reserva, cancelaciones, ausencias, ocupación, retención y uso de escuela.

## P2 · Superar a las alternativas en gestión del club

- [ ] Añadir gestión multiclub con panel central, informes consolidados y permisos por sede.
- [ ] Publicar una API estable y webhooks para integraciones de terceros.
- [ ] Facilitar la convivencia temporal con Playtomic o Matchpoint durante una migración.
- [ ] Mejorar la PWA con instalación guiada, notificaciones fiables, funcionamiento degradado sin conexión y medición de adopción.
- [ ] Evaluar una aplicación móvil con marca del club solo cuando la PWA demuestre una limitación real.
- [ ] Integrar control de acceso, iluminación y credenciales QR o móviles mediante proveedores desacoplados.
- [ ] Añadir caja, inventario, bar y tienda como módulo opcional de operaciones presenciales.
- [ ] Ampliar torneos con Americana, Rey o Reina de la pista, patrocinadores, premios y cuadros públicos en tiempo real.
- [ ] Añadir roles personalizados con permisos granulares y plantillas por tipo de empleado.

## P3 · Construir una ventaja difícil de copiar

- [ ] Crear previsiones de demanda y recomendaciones explicables de horarios, ocupación y capacidad.
- [ ] Probar recomendaciones de precio solo como simulación hasta disponer de datos reales suficientes.
- [ ] Diseñar un asistente operativo que responda con datos del club, permisos estrictos y registro de acciones.
- [ ] Evaluar vídeo, cámaras y generación de momentos destacados únicamente después de estabilizar la operación principal.

## Métricas para decidir qué construir después

- [ ] Tiempo desde alta hasta primera reserva operativa.
- [ ] Tiempo diario dedicado por recepción a tareas manuales.
- [ ] Porcentaje de reservas que requieren corrección humana.
- [ ] Ocupación por pista y franja horaria.
- [ ] Conversión de lista de espera y partido abierto.
- [ ] Cancelaciones y ausencias por segmento.
- [ ] Activación y uso semanal de administradores y jugadores.
- [ ] Incidencias por cada cien reservas y tiempo medio de resolución.
- [ ] Retención del club y satisfacción del personal en semanas 1, 3 y 6.

## Referencias de mercado revisadas

La priorización contrasta el alcance actual con capacidades comunicadas públicamente por [AppPadel](https://apppadel.com/es/), [Rebotea](https://rebotea.com/), [Doinsport](https://doinsport.com/es/), [GestionPadel](https://gestionpadel.com/es) y [Volea](https://volea.club/). Estas referencias sirven para detectar expectativas del mercado, no para copiar implementaciones ni asumir que todas sus afirmaciones están verificadas de forma independiente.
