# PadelClub OS — Handoff Fase 2 (Dirección Marcador)

**Para: Claude Code.** Las fases 1–5 (fundaciones/tokens, shells de navegación, componentes, flujos críticos, pantallas de segunda capa) **ya están implementadas en producción — no las toques salvo lo indicado**. Este paquete cubre únicamente la Fase 6: superficie pública (landing + blog), emails, y assets de marca en trazados.

## Prompt de implementación (copiar tal cual a Claude Code)

---

Implementa la Fase 6 de la identidad «Marcador» de PadelClub OS. Las fases 1–5 ya están en producción: los tokens semánticos (`tokens.padelclubos.json` → CSS vars `--background`, `--primary`, `--status-*`, `--tenant-*`, etc.), las fuentes autohospedadas Archivo (variable, `font-stretch:112%`) e Instrument Sans, el motor de tenant y todos los componentes del admin y del portal jugador existen y funcionan. **No redefinas tokens, fuentes ni componentes existentes: reutilízalos.** Los mocks de este paquete (`*.dc.html`, abrir en navegador) son la especificación visual exacta; los valores inline de los mocks ya corresponden a los tokens en producción — mapéalos a las CSS vars, no los copies como literales nuevos.

### 1. Landing pública (`Landing PadelClub OS.dc.html`)
Reescribe la landing actual de padelclubos.com conservando **exactamente los copys existentes** (el mock ya los usa verbatim) y aplicando la estética Marcador:
- Nav sticky 64px con blur, isotipo SVG nuevo (`assets/isotipo-color.svg`) + wordmark «Padel Club OS» en Archivo 750 wdth 112. CTA «Solicitar demo» verde `--primary`.
- Hero: badge «Prueba gratuita 14 días — sin tarjeta», H1 56px Archivo 800, visual de tarjeta con 3 KPIs (Reservas hoy 24 / Socios activos 342 / Ocupación 87%) + mini-grid de 4 pistas × 4 franjas con celdas de estado (reservada = verde sólido, clase = verde tinte, libre = borde discontinuo). Cifras con `font-variant-numeric: tabular-nums`.
- 4 tarjetas de beneficio rápido; sección «¿Suena familiar?» sobre tinta `#1C1A17` con 3 tarjetas Ahora (rojo suave `#E08A7A`) / Con Padel Club OS (verde `#6FBF9C`), CTA «Resuelve estos problemas hoy».
- «Todo lo que tu club necesita…»: grid 4×2 con las 8 funcionalidades numeradas en JetBrains Mono.
- «Configura tu club en 5 minutos»: 3 pasos numerados sobre superficie `#EFECE6`.
- Precios: toggle Mensual/Anual (el mock muestra mensual; anual = comportamiento actual del sitio), 3 planes Starter 19€ / Pro 49€ (tarjeta tinta invertida, badge «Más popular», `white-space:nowrap`) / Enterprise 99€, con «14 días gratis incluidos · IVA no incluido» y listas de features exactas del sitio actual. Tabla comparativa «Gestión tradicional vs Padel Club OS» (5 filas).
- FAQ (6 preguntas, layout 2 columnas), CTA final «Tu club no puede esperar más», footer tinta con columnas Producto/Empresa/Legal completas y «Hecho en España».
- Los bloques de foto son placeholders: usar el patrón rayado del mock hasta recibir la sesión (ver `brief-fotografia.md`). Responsive: colapsar grids a 1 columna <768; el mock es la referencia 1200+.

### 2. Blog (`Blog PadelClub OS.dc.html`)
- Cabecera con «Volver al inicio», H1 Archivo 800, subtítulo actual del blog.
- Artículo destacado (el más reciente) como tarjeta horizontal sobre tinta con chip de categoría verde, imagen a la derecha (placeholder rayado oscuro).
- Grid 3 columnas con el resto de posts: chip de categoría con color semántico fijo por categoría — Negocio warning `#C7871E`, Gestión verde `#157A54`, Tecnología info `#2E63C0`, Consejos `#7B4B94`, Industria verde claro `#6FBF9C` sobre tinta. Meta: avatar iniciales, autor, fecha, «N min» tabular.
- Mantener slugs, títulos, extractos, autor y fechas actuales (el mock los usa verbatim). La plantilla de artículo individual hereda esta cabecera/footer; cuerpo a 720px, tipografía Instrument Sans 17/1.7, H2 Archivo.

### 3. Emails (`Emails Transaccionales y Marketing.dc.html`)
Implementar como plantillas (React Email, MJML o tablas a mano — lo que use el stack) con **tablas anidadas, 600px, estilos inline**:
- **Confirmación de reserva** (tenant): header logo/inicial del club + badge estado success, H2 «Tu pista está reservada, {nombre}», **módulo marcador** (tarjeta 3 celdas Pista/Fecha/Hora con borde 2px tinta y fila de total) — este módulo es el gesto propietario, reutilízalo—, CTA color tenant, enlace «Añadir al calendario» (.ics), nota de política de cancelación, footer club + «Powered by PadelClub OS» monocromo 60% (isotipo gris + JetBrains Mono 10px).
- **Recibo de pago** (tenant): nº recibo en mono, tabla de conceptos con descuento en verde success y total en Archivo 750, CTA «Descargar factura (PDF)» en tinta, CIF en footer.
- **Recordatorio de partido T−24h** (tenant): «Mañana juegas», línea fecha/pista, chips de los 4 jugadores con avatares de color, CTA «Abrir chat del partido», secundario destructivo «No puedo ir».
- **Reset password** (plataforma, no tenant): marca PadelClub OS verde, caducidad 30 min, msg-id en footer. Sale de `no-reply@padelclubos.com`.
- **Campaña torneo** (tenant, marketing): hero tinta con fila de celdas Fechas/Categorías/Plazas, bloque de foto, CTA tenant + «Ver bases», footer con «Darme de baja».
- Reglas: solo 2 variables de tenant por email (`tenant-600` para CTA/avatar + logo); los semánticos de estado NUNCA toman el color del club; `color-scheme: light only` en transaccionales; fallbacks tipográficos Arial Narrow/Arial (display) y Helvetica/Arial (texto); todos los transaccionales del dominio del club, cuenta/plataforma de padelclubos.com.

### 4. Assets de marca en trazados (`assets/`)
- `wordmark-outline(.dark).svg` y `logo-horizontal-outline(-dark).svg`: wordmark «PadelClub» + chip OS convertidos a trazados (sin dependencia de fuente). Usar para PDF de facturas, papelería y cualquier salida print. No sustituyen a los PNG @2x en email (mantener PNG ahí).
- Actualizar favicon/manifest si aún no se hizo: `favicon.svg`, `icon-maskable.svg` (purpose any maskable, exportar PNG 512/192).

### 5. Fotografía
`brief-fotografia.md` define la sesión. Hasta tener las fotos, TODOS los huecos de imagen usan el placeholder rayado del mock (repeating-linear-gradient 45°, etiqueta mono) — nunca stock genérico.

### Criterios de aceptación
- Copys de landing y blog idénticos byte a byte a los actuales (solo cambia la piel).
- Cero azul SaaS: el azul solo aparece como semántico de información o color de tenant demo.
- Todas las cifras (KPIs, precios, horas) con `tabular-nums` y Archivo en display.
- Contraste AA en todos los pares texto/fondo, incluidos CTAs de tenant (usar el motor existente).
- Emails renderizando correctamente en Gmail, Outlook (Windows) y Apple Mail; test con el módulo marcador degradando a tabla simple donde no haya soporte de border-radius.
- Links `a`/`a:hover` definidos con la paleta en cada superficie nueva.

---

## Contenido del paquete
- `Landing PadelClub OS.dc.html` · `Blog PadelClub OS.dc.html` · `Emails Transaccionales y Marketing.dc.html` — mocks navegables (abrir en navegador; requieren `support.js` junto a ellos).
- `Assets de Marca.dc.html` — inventario y reglas de uso de todos los assets.
- `assets/` — isotipo (color/mono/negativo), favicon, PWA maskable, lockups PNG @2x y **nuevos SVG en trazados** (`*-outline*.svg`).
- `brief-fotografia.md` — dirección, lista de tomas y entregables técnicos.
- `tokens.padelclubos.json` — referencia de tokens (sin cambios respecto a fase 1; incluido por comodidad).
