# Material Profesional para Lanzamiento - Padel Club OS

## Contexto
Inventario completo de documentación y materiales necesarios para lanzar Padel Club OS al mercado de forma profesional. Organizado por prioridad.

---

## FASE 1: Imprescindible para lanzar

| # | Material | Tipo | Esfuerzo | Estado |
|---|----------|------|----------|--------|
| 1 | Pitch Deck (12-15 slides) | Ventas | 2-3 días | Pendiente |
| 2 | One-Pager / Ficha de Producto | Ventas | 1 día | Pendiente |
| 3 | Demo en vídeo (admin + jugador) | Ventas | 2-3 días | Pendiente |
| 4 | Guía de Inicio Rápido (5 pasos) | Usuario | 1 día | Pendiente |
| 5 | FAQ / Preguntas Frecuentes | Usuario | 1 día | Pendiente |
| 6 | DPA - Acuerdo Tratamiento Datos | Legal | Abogado | Pendiente |
| 7 | Contrato SaaS (B2B) | Legal | Abogado | Pendiente |
| 8 | Revisión legal /privacidad y /terminos | Legal | Abogado | Pendiente |

### Detalle Fase 1

**Pitch Deck**: Problema → Solución → Demo visual → Funcionalidades → Diferenciadores vs Matchpoint/Playtomic → Planes y precios (Starter 19€, Pro 49€, Enterprise 99€) → Roadmap → Equipo → CTA (prueba gratis 14 días)

**One-Pager**: PDF 1 página. Logo, 3-4 beneficios clave, capturas mini, precios, QR al sitio web. Para dejar en recepciones de clubes o enviar por WhatsApp.

**Demo vídeo**: 2 vídeos. Admin (3-5 min): dashboard, pistas, reservas, socios, competiciones, rankings. Jugador/PWA (2-3 min): reservar, partidas, rankings, perfil.

**Guía Inicio Rápido**: PDF 2-3 páginas. Registro → Crear pistas → Configurar precios → Dar de alta socios → Primera reserva.

**DPA**: OBLIGATORIO por RGPD. Define qué datos se procesan, finalidad, medidas de seguridad, subencargados (Vercel, Neon/Supabase, Stripe, Resend). Cada club debe firmar uno.

**Contrato SaaS**: Obligaciones, limitaciones de responsabilidad, renovación, cancelación. Especialmente importante para plan Enterprise.

---

## FASE 2: Importante para primeras semanas

| # | Material | Tipo | Esfuerzo | Estado |
|---|----------|------|----------|--------|
| 9 | Manual Usuario Admin (completo) | Usuario | 3-5 días | Pendiente |
| 10 | Manual Usuario Jugador/PWA | Usuario | 2-3 días | Pendiente |
| 11 | Centro de Ayuda (web) | Soporte | 2-3 días | Pendiente |
| 12 | Matriz Comparativa Competencia | Ventas | 1 día | Pendiente |
| 13 | Proceso Onboarding documentado | Operaciones | 1 día | Pendiente |
| 14 | Brand Guidelines (manual de marca) | Marketing | 1-2 días | Pendiente |
| 15 | Changelog público | Técnico | 1 día | Pendiente |

### Detalle Fase 2

**Manual Admin**: Dashboard, pistas (crear/editar/precios por horario), socios (alta/importación CSV/roles), reservas (calendario/grid), partidas abiertas, competiciones (ligas/torneos), noticias, rankings ELO, facturación Stripe, ajustes, notificaciones, exportaciones CSV, búsqueda global.

**Manual Jugador/PWA**: Registro, instalación PWA (Android/iOS), reservar pista (paso a paso), partidas abiertas (buscar/unirse/crear), competiciones, rankings/estadísticas, perfil, noticias, notificaciones push, tarifas.

**Matriz Comparativa**: Tabla Padel Club OS vs TPC Matchpoint vs Playtomic vs hojas de cálculo. Columnas: funcionalidades, precio, personalización, soporte, PWA, multi-idioma.

**Onboarding**: Checklist interno: bienvenida → llamada setup → formación → go-live → seguimiento 1 semana → seguimiento 1 mes.

**Brand Guidelines**: Logo (variantes, espacios, usos incorrectos), paleta de colores, tipografías, tono de voz, iconografía.

---

## FASE 3: Para escalar

| # | Material | Tipo | Esfuerzo | Estado |
|---|----------|------|----------|--------|
| 16 | Documentación API (OpenAPI/Swagger) | Técnico | 3-5 días | Pendiente |
| 17 | Documentación técnica desarrolladores | Técnico | 3-5 días | Pendiente |
| 18 | SLA (Acuerdo Nivel de Servicio) | Legal | 1 día + abogado | Pendiente |
| 19 | Vídeo-tutoriales por funcionalidad | Usuario | 5-7 días | Pendiente |
| 20 | Calculadora ROI | Ventas | 1-2 días | Pendiente |
| 21 | Kit de Prensa | Marketing | 1 día | Pendiente |
| 22 | Casos de Uso / Testimonios (plantilla) | Ventas | 1 día | Pendiente |
| 23 | Política de Seguridad | Legal | 1 día | Pendiente |
| 24 | Plantillas email marketing | Marketing | 2-3 días | Pendiente |

### Detalle Fase 3

**Doc API**: OpenAPI/Swagger para las ~45 rutas. Endpoint, método, headers, body (schemas Zod), responses, ejemplos. Página interactiva tipo Swagger UI.

**Doc técnica**: Arquitectura, estructura proyecto, setup desarrollo, modelos de datos (diagrama ER), auth/RBAC, notificaciones, pagos Stripe, PWA, testing, deployment.

**Calculadora ROI**: "Un club con X pistas y Y socios ahorra Z horas/mes y gana W€ extra". Excel interactivo o página web.

**Kit de Prensa**: ZIP con logos alta resolución (SVG, PNG), capturas del producto, bio fundador, descripción producto (corta y larga), datos clave.

---

## Notas
- Lo legal (DPA, contrato, SLA, revisión privacidad/términos) necesita abogado SÍ O SÍ
- La doc API puede auto-generarse parcialmente desde el código (schemas Zod)
- Los testimonios/casos de uso se prepara la plantilla ahora y se llena con primeros clientes
- Centro de Ayuda: valorar Notion público, GitBook, o sección /ayuda en la web
