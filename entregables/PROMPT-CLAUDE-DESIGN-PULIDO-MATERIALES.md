# Prompt para Claude Design

Quiero que actúes como director de arte senior, diseñador editorial y especialista en presentaciones comerciales B2B SaaS. Debes revisar, rediseñar y pulir profesionalmente dos materiales de PadelClub OS sin alterar la veracidad del producto.

El contenido de ambos materiales ya ha pasado una revisión editorial y factual completa (agosto de 2026). Tu trabajo es visual y tipográfico: no reescribas el contenido salvo ajustes menores de longitud que exija la composición, y en ese caso sin cambiar el significado.

## Archivos principales

- Deck comercial editable: `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\entregables\deck-comercial-padelclub-os.pptx`
- Manual de usuario editable: `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\entregables\manual-usuario-padelclub-os.docx`

## Identidad corporativa obligatoria

Estudia estos archivos antes de diseñar:

- `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\docs\PROMPT-MAESTRO-IDENTIDAD-VISUAL.md`
- `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\docs\identidad-marcador.md`
- `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\design_handoff_identidad_marcador\README.md`
- `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\design_handoff_identidad_marcador\tokens.padelclubos.json`
- Recursos gráficos: `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\design_handoff_identidad_marcador\assets` (isotipos y logos en SVG/PNG; hay más SVG de marca en `padel-club-os\public\brand`)

Usa como referencia comparativa, nunca como fuente de producto, el documento anterior:

- `C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\entregables\Player Portal Design System.pdf`

Ese PDF contiene afirmaciones ya retiradas del producto (pagos online de reservas, precios 19/49/99, «5 minutos», métricas ilustrativas). No recuperes nada de su contenido; solo sirve para comparar el salto visual.

## Sistema visual que debes respetar

- Concepto de marca: Marcador
- Fondo papel: `#F6F3ED`
- Tinta principal: `#1C1A17`
- Verde de marca: `#157A54`
- Superficie elevada: `#FFFFFF`
- Borde: `#DDD7CC`
- Tipografía de titulares: Archivo
- Tipografía de cuerpo: Instrument Sans
- Sensación buscada: editorial deportiva, operativa, clara, sobria y española
- Evita el aspecto de plantilla SaaS genérica, los degradados decorativos, el exceso de sombras y los iconos sin función
- Prohibido en la identidad Marcador: animación continua, shimmer, orbes y glassmorphism; el estado nunca se comunica solo por color (añade icono, texto o trama)
- Nombre de marca en estos materiales: «PadelClub OS», siempre con esa grafía

### Tipografías: condición de entrega

Archivo e Instrument Sans deben quedar embebidas en el PPTX y el DOCX o, si el formato no lo permite de forma fiable, define la pila de sustitución explícita (Archivo → Arial Narrow/Arial; Instrument Sans → Arial) y dilo en el informe de cambios. Un editable que se abre con fuentes sustituidas sin control se considera entrega fallida.

## Reglas de veracidad que no puedes romper

- No inventes precios, planes, descuentos, métricas, testimonios, clientes, plazos ni porcentajes.
- No afirmes que una reserva se paga en línea. PadelClub OS registra el estado del pago por jugador, pero el cobro de la reserva se realiza de forma presencial o mediante el procedimiento externo definido por el club.
- No recuperes las tarifas 19, 49 o 99 euros del PDF antiguo.
- No afirmes que la implantación tarda cinco minutos.
- No presentes una funcionalidad como disponible si no figura en los materiales principales.
- No inventes capturas de interfaz. Si no tienes una pantalla real, utiliza diagramas, wireframes claramente conceptuales o composición tipográfica.
- No cambies nombres de funciones, roles ni procesos sin comprobarlos en el deck y el manual.
- No expongas secretos, variables de entorno ni detalles técnicos internos.

## Trabajo sobre el deck comercial

El deck contiene 15 diapositivas con una narrativa aprobada y cerrada: portada, problema, comparativa «Hoy / Con PadelClub OS», dos experiencias, reservas, cobro presencial, importación, comunidad, comunicación, analítica, cambio acompañado, base de producto, piloto, alcance transparente y cierre con llamada a la acción. Consérvala tal cual, incluido el orden.

Atención especial:

- La diapositiva 3 (tabla comparativa «El mismo club, con y sin sistema») se añadió a nivel de contenido sin diseño: llegará con formato de tabla básica. Es tuya para maquetarla al nivel del resto; el texto de sus celdas no se toca.
- La portada incluye un kicker de marca sobre el título («PADELCLUB OS · GESTIÓN INTEGRAL DE CLUBES DE PÁDEL») también sin estilo aplicado.
- Todas las diapositivas ya tienen notas del presentador redactadas con guion comercial. Consérvalas; solo puedes mejorarlas si aportas contenido comercial real, nunca eliminarlas.

Objetivos:

1. Conseguir que un propietario o gerente de club entienda el valor en menos de tres minutos.
2. Hacer que cada diapositiva tenga una idea principal inequívoca.
3. Reducir texto donde pueda sustituirse por una estructura visual más clara, sin perder afirmaciones de alcance o veracidad (las líneas «Sin TPV fiscal…», «Sin pagos reales durante el piloto» y similares son intocables).
4. Mantener un tono seguro y concreto, sin promesas grandilocuentes.
5. Mejorar tablas, diagramas, titulares, márgenes, retícula y contraste.
6. Aplicar Archivo e Instrument Sans en todos los estilos.
7. Confirmar que todo se entiende en pantalla y en PDF.

Entrega el deck como PowerPoint totalmente editable y como PDF de presentación.

## Trabajo sobre el manual de usuario

El manual es la edición 1.1 (21 de agosto de 2026): ocho capítulos, unas 22-24 páginas A4, dirigido a personas no técnicas. Conserva todo el contenido funcional y su estructura didáctica.

Atención especial: la edición 1.1 añadió secciones nuevas que heredan el estilo clonado de las existentes (idioma/tema/PWA, publicar el portal, políticas de reserva, reagendar, repetir y compartir reserva, tarifas, mapa del portal, directorio de jugadores, reporte desde la aplicación) y varios avisos nuevos (ASISTENTE DE CONFIGURACIÓN, INVITACIONES, RECORDATORIOS AUTOMÁTICOS, AVISO AUTOMÁTICO, CÓMO FUNCIONA EL AVISO, OPCIONES DEL DESGLOSE, FORMATO DE RESULTADOS, LÍMITE DE ENVÍOS, PLAZO DE VALORACIÓN, SEGURIDAD DEL ENLACE). Revisa que su maquetación quede indistinguible del resto.

El manual incluye además 16 marcadores «CAPTURA PENDIENTE», cada uno con su pie de figura numerado («Figura N · …»), y un anexo final con la lista completa. El propietario insertará las capturas reales más adelante. Tu trabajo con ellos:

- Conserva los 16 marcadores y sus pies exactamente donde están y con su numeración.
- Dales un estilo de marcador de posición inequívoco: un recuadro discreto con proporción aproximada de captura (16:10 o similar) que nadie pueda confundir con contenido definitivo.
- Maqueta los pies como pies de figura reales (cuerpo pequeño, consistente), porque permanecerán bajo la captura cuando esta se inserte.
- No sustituyas ningún marcador por imágenes generadas ni recreaciones de la interfaz.

Objetivos:

1. Mejorar portada, jerarquía editorial, navegación visual, ritmo de página y legibilidad.
2. Mantener los ocho capítulos y todos los procedimientos.
3. Conservar la estructura objetivo, pasos, resultado esperado y advertencia.
4. Evitar cuerpos demasiado pequeños. Prioriza la lectura cómoda en pantalla e impresión A4.
5. Mejorar tablas, checklists, llamadas de atención, encabezados y pies de página.
6. Crear una tabla de contenidos navegable si puede hacerse sin romper la compatibilidad con Word.
7. Mantener encabezados semánticos, listas numeradas reiniciadas y texto alternativo en imágenes.
8. No añadir capturas ficticias. Los marcadores y la lista de capturas necesarias ya existen (ver arriba); no crees marcadores nuevos sin justificarlo en el informe.
9. Mantener el documento completamente editable en Word.
10. Comprobar que no existen páginas casi vacías, líneas viudas, tablas cortadas de forma confusa ni elementos fuera de margen.

Entrega el manual como DOCX totalmente editable y como PDF listo para compartir.

## Criterios de calidad final

- Consistencia total entre deck, manual e identidad corporativa.
- Lenguaje claro para público español.
- Fechas absolutas cuando aparezcan fechas.
- Buena accesibilidad, contraste suficiente, jerarquía correcta y texto alternativo útil.
- Ningún elemento fuera de página o diapositiva.
- Ninguna sustitución de fuentes al abrir los editables (o pila de sustitución explícita documentada en el informe).
- Ningún dato inventado.
- Revisión ortográfica completa.

## Forma de trabajar y carpeta de salida

Trabaja con autonomía y no te detengas por decisiones menores. Ante una duda factual, conserva la formulación del material original. Crea copias nuevas y no sobrescribas los archivos de partida.

Guarda los resultados aquí:

`C:\Users\alberto.bort\Desktop\PROYECTOS\padel-club-os\entregables\claude-design-pulido`

Nombres esperados:

- `deck-comercial-padelclub-os-pulido.pptx`
- `deck-comercial-padelclub-os-pulido.pdf`
- `manual-usuario-padelclub-os-pulido.docx`
- `manual-usuario-padelclub-os-pulido.pdf`
- `informe-de-cambios.md`

Antes de terminar, renderiza y revisa visualmente todas las diapositivas y todas las páginas. En `informe-de-cambios.md`, resume las mejoras realizadas, las decisiones visuales, la solución aplicada a las tipografías y cualquier aspecto que deba validar el equipo de PadelClub OS.
