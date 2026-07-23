# Prompt maestro — identidad visual definitiva de PadelClub OS

> Copia desde “INICIO DEL PROMPT” hasta “FIN DEL PROMPT” en Claude Design. Dale acceso al repositorio completo y, si la herramienta lo permite, a una instancia local con datos de demostración.

---

## INICIO DEL PROMPT

El codebase adjunto corresponde al producto real de PadelClub OS. Analízalo antes de diseñar y sigue íntegramente las instrucciones siguientes.

Actúa como un equipo senior compacto formado por un **director creativo de marca, un principal product designer especializado en SaaS B2B2C, un design systems lead, un experto en interfaces deportivas y un especialista en accesibilidad**. Tienes criterio editorial propio y capacidad para tomar decisiones. Tu trabajo no consiste en decorar pantallas existentes, sino en definir, demostrar y documentar una identidad visual de producto distintiva, coherente, escalable y lista para producción.

## 1. Misión

Evalúa en profundidad la solución actual de **PadelClub OS** y crea su **identidad visual corporativa y de producto definitiva** para que pueda convertirse en la referencia estética y de experiencia de usuario del software de gestión de clubes de pádel.

La solución final debe funcionar como un sistema único en tres contextos relacionados, pero con necesidades diferentes:

1. **Portal de plataforma / superadministración:** gestión global de clubes, demos, planes, suscripciones, leads, blog y operación de la plataforma.
2. **Portal de administración del club:** herramienta diaria para propietarios, managers y personal de recepción; incluye dashboard, agenda, reservas, cobros, pistas, socios, competiciones, comunicación, analítica, equipo, facturación y configuración.
3. **Portal del jugador y presencia digital de cada club:** experiencia B2C, móvil y multi-tenant para reservar, pagar, buscar partidas, competir, consultar rankings, relacionarse con otros jugadores y consumir noticias del club. Debe admitir personalización de marca por club sin perder la calidad, accesibilidad ni coherencia de PadelClub OS.

El resultado no puede ser un moodboard superficial ni un rediseño genérico de dashboard. Debe ser una propuesta integral que incluya **auditoría, estrategia de marca, dirección creativa, sistema visual, componentes, pantallas de alta fidelidad, comportamiento responsive, reglas multi-tenant y especificaciones de handoff**.

## 2. Objetivo de marca

La identidad debe transmitir, de forma equilibrada:

- control operativo y fiabilidad;
- velocidad, precisión y claridad;
- energía deportiva contemporánea, sin agresividad ni clichés;
- pertenencia, competición y comunidad;
- calidad premium accesible, no lujo distante;
- carácter digital europeo y una calidez mediterránea sutil;
- capacidad tecnológica seria para gestionar un club real durante todo el día.

La ambición es ser **la experiencia visual y de producto más pulida, reconocible y útil de la categoría**, no parecerse a una plantilla SaaS ni imitar a un competidor. La diferenciación debe nacer de una idea visual propia y repetible, no de efectos decorativos.

## 3. Contexto real del producto

PadelClub OS es una plataforma SaaS multi-tenant para clubes de pádel en España, preparada para internacionalización ES/EN. Los roles actuales son `SUPER_ADMIN`, `CLUB_ADMIN`, `STAFF` y `PLAYER`.

El producto ya incluye, entre otras capacidades:

- dashboard con KPIs, agenda, ocupación, ingresos y pagos pendientes;
- reservas en calendario y grid por pista, reservas recurrentes y bloqueos;
- pistas, tarifas por franja, socios, importación y exportación;
- pagos online/presenciales y cobro por jugador;
- competiciones, partidas abiertas, ranking ELO y analítica;
- noticias, comunicaciones push/email/in-app y blog;
- perfil de jugador, directorio social, valoraciones y chat de partida;
- lista de espera, reagendado y cancelaciones;
- onboarding, estados de suscripción, facturación y configuración de club;
- PWA, modo claro/oscuro, accesibilidad base e internacionalización.

Stack actual que debes respetar al plantear el handoff:

- Next.js 14, React 18 y TypeScript;
- Tailwind CSS con variables semánticas HSL;
- Radix UI y componentes inspirados en shadcn/ui;
- Lucide para iconografía;
- Recharts para gráficos y FullCalendar para calendarios;
- `next-themes` para modo claro/oscuro;
- `next-intl` para español e inglés;
- interfaz responsive y PWA.

Tipografías actuales: Inter para texto y Sora para display. Color primario actual: azul genérico alrededor de `hsl(217 91% 50%)`. El portal de jugador permite `logoUrl`, `bannerUrl` y un `primaryColor` elegido por cada club. No asumas que estas decisiones deben conservarse: evalúalas y conserva, evoluciona o sustituye lo que corresponda con argumentos.

## 4. Investigación y auditoría obligatoria

Antes de diseñar, inspecciona el producto real. Lee como mínimo:

- `README.md`
- `CLAUDE.md`
- `FUNCIONAL.md`
- `package.json`
- `tailwind.config.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
- `src/app/dashboard/layout.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Header.tsx`
- `src/components/layout/MobileNavBar.tsx`
- `src/components/club/ClubLayout.tsx`
- `src/components/club/ClubHome.tsx`
- `src/components/dashboard/DashboardClient.tsx`
- `src/lib/nav-items.ts`
- `src/components/ui/*`
- las rutas principales bajo `src/app/dashboard/*` y `src/app/club/[slug]/*`.

Si dispones de ejecución o navegador:

1. Levanta la aplicación y utiliza únicamente datos de demo/locales.
2. Recorre los flujos como superadmin, administrador/staff y jugador.
3. Captura y compara las vistas en 390 × 844, 768 × 1024, 1024 × 768 y 1440 × 1000.
4. Revisa modo claro y oscuro, navegación con teclado, zoom al 200 %, textos largos en español e inglés, carga, vacío, error, éxito, deshabilitado y permisos restringidos.
5. No alteres datos reales ni uses servicios de producción.

Audita con evidencia los siguientes ejes:

- reconocimiento de marca y singularidad;
- jerarquía visual y escaneabilidad;
- consistencia entre plataforma, administración y jugador;
- densidad adecuada para operación diaria;
- legibilidad de calendarios, tablas, estados y gráficos;
- navegación, orientación y arquitectura visual;
- calidad percibida en escritorio y móvil;
- coherencia de iconografía, radios, sombras, bordes, color y espaciado;
- calidad y consistencia de microcopy;
- accesibilidad WCAG 2.2 AA y uso sin depender solo del color;
- robustez de la personalización por club;
- deuda visual generada por estilos puntuales o componentes duplicados;
- viabilidad técnica y coste razonable de adopción.

Señala con claridad qué funciona, qué debe evolucionar y qué debe retirarse. No des por válido algo solo porque ya está implementado.

## 5. Arquitectura de marca obligatoria

Define una arquitectura que resuelva estas capas:

### 5.1 Marca maestra

**PadelClub OS** es la marca de producto y debe tener una firma propia, reconocible y profesional. Evalúa el símbolo actual —una pista dentro de un contenedor cuadrado con degradado azul/cian— y propone conservarlo, evolucionarlo o sustituirlo. La decisión debe estar argumentada.

Entrega, al menos:

- concepto y narrativa de marca en una frase;
- atributos y personalidad verbal/visual;
- logotipo principal y compacto;
- isotipo, wordmark y lockups horizontal/vertical;
- versiones color, monocroma, negativa y para tamaños pequeños;
- favicon e icono PWA/maskable;
- área de seguridad, tamaños mínimos y usos incorrectos;
- criterio de convivencia entre logo de PadelClub OS y logo de cada club.

### 5.2 Experiencia de plataforma

Debe sentirse como el centro de control de una compañía tecnológica: alta claridad, visión transversal, trazabilidad y autoridad. Puede tener una densidad mayor y señales de estado más operativas que el portal de jugador.

### 5.3 Experiencia de administración de club

Debe optimizar velocidad y confianza en tareas repetitivas. La estética debe soportar jornadas largas, calendarios densos, tablas extensas, cobros, alertas y acciones rápidas. Premium no significa espacioso en exceso: define una densidad profesional y cómoda.

### 5.4 Experiencia del jugador / club

Debe ser móvil primero, directa, social y motivadora. El club es el protagonista visible; PadelClub OS actúa como garantía tecnológica mediante un co-branding discreto y consistente. La experiencia debe sentirse como una app deportiva de alta calidad, no como el dashboard administrativo encogido.

### 5.5 Sistema multi-tenant

Diseña una estrategia robusta de personalización:

- separa **tokens de marca maestra**, **tokens semánticos de producto** y **tokens de tenant/club**;
- define exactamente dónde puede actuar el color del club y dónde no;
- genera automáticamente una escala tonal accesible desde el color del club;
- calcula colores `on-primary`, foco, hover, pressed y estados con contraste válido;
- evita que colores de club extremos rompan botones, textos, gráficos o modo oscuro;
- los colores de éxito, aviso, error e información nunca deben confundirse con el color de marca;
- establece reglas para logos claros/oscuros, proporciones, fondos, recorte y fallback;
- define el tratamiento de banner/fotografía para que texto y acciones siempre sean legibles;
- incluye una previsualización de marca en ajustes y advertencias automáticas de contraste;
- explica cuándo aparece “Powered by PadelClub OS” y con qué jerarquía.

No resuelvas la personalización aplicando directamente un hexadecimal arbitrario a toda la interfaz.

## 6. Exploración creativa y selección

Antes de fijar la dirección final, desarrolla **tres territorios visuales realmente distintos**. Para cada territorio muestra:

- nombre conceptual y principio rector;
- referencia cultural/deportiva abstracta, sin copiar marcas existentes;
- logotipo o evolución de marca;
- paleta, tipografía, composición, formas, iconografía, fotografía y motion;
- una muestra del dashboard administrativo y otra del portal móvil del jugador;
- fortalezas, riesgos y dificultad técnica.

Evalúa los tres territorios mediante esta matriz ponderada:

| Criterio | Peso |
|---|---:|
| Diferenciación y memorabilidad | 20 % |
| Coherencia entre los tres portales | 20 % |
| Usabilidad y capacidad para datos densos | 15 % |
| Relevancia deportiva sin clichés | 15 % |
| Confianza y calidad percibida | 10 % |
| Accesibilidad e inclusión | 10 % |
| Viabilidad técnica y escalabilidad | 10 % |

Selecciona una única dirección ganadora. No delegues la decisión final ni mezcles arbitrariamente los tres conceptos. Explica en pocas líneas por qué es la mejor plataforma creativa a largo plazo y desarrolla el resto del trabajo exclusivamente sobre ella.

## 7. Principios de dirección de arte

La propuesta final debe cumplir estas reglas:

- tener un gesto visual propietario inspirado de forma abstracta en la geometría, el ritmo, la trayectoria, la red, el cristal, las zonas o el marcador del pádel, sin llenar la interfaz de pistas, pelotas o palas;
- diferenciarse de la estética genérica de shadcn/Tailwind y de las plantillas SaaS;
- priorizar estructura, tipografía, ritmo, contraste y contenido antes que efectos;
- admitir fotografía real de clubes y jugadores con una dirección fotográfica definida;
- usar el color con intención funcional, no como relleno;
- ofrecer modo claro excelente y modo oscuro diseñado, no simplemente invertido;
- mantener una personalidad reconocible incluso sin logo;
- expresar energía mediante composición y microinteracción, sin ruido visual;
- funcionar igual de bien para un club pequeño y para una cadena de centros.

Evita explícitamente:

- copiar a Playtomic, TPC Matchpoint, Doinsport u otras marcas del sector;
- verde neón + negro como atajo obvio de “deporte”; 
- degradados aleatorios, glassmorphism indiscriminado, brillos, blobs u orbes sin función;
- sombras excesivas, tarjetas dentro de tarjetas y redondeos exagerados;
- iconos de pala o pelota repetidos como decoración;
- mayúsculas, italic o tipografía condensada en exceso;
- interfaces monocromas sin jerarquía, o interfaces multicolor sin sistema;
- animaciones continuas que distraigan;
- ocultar mala jerarquía detrás de ilustraciones o mockups espectaculares;
- sacrificar densidad operativa para que una captura se vea más vacía.

## 8. Sistema visual que debes definir

Entrega especificaciones exactas y aplicables, no adjetivos vagos.

### 8.1 Color

- paleta corporativa primaria y secundaria;
- neutros con temperatura propia;
- colores semánticos de información, éxito, aviso y error;
- escalas completas para claro y oscuro;
- colores de gráficos y calendarios, distinguibles también con deficiencias de visión cromática;
- tokens de superficie, texto, borde, foco, selección, overlay y estados interactivos;
- combinaciones aprobadas con ratios de contraste;
- relación entre paleta PadelClub OS y paleta de cada club.

### 8.2 Tipografía

- familias principal y de display, con alternativas de sistema y criterios de licencia/rendimiento;
- escala tipográfica completa, pesos, interlineado y tracking;
- estilos para KPIs, tablas, calendarios, navegación, etiquetas, formularios y contenido editorial;
- cifras tabulares donde sean necesarias;
- comportamiento responsive y para textos largos ES/EN.

No mantengas Inter/Sora por inercia; decide si siguen siendo adecuadas.

### 8.3 Composición

- retícula, ancho de contenido y breakpoints;
- escala de espaciado basada en 4 px;
- densidad “operativa” para admin y “touch/comunidad” para jugador;
- tamaños de sidebar, header y navegación inferior;
- radios, bordes, elevación y capas;
- reglas para módulos, secciones y agrupación sin abusar de cards;
- jerarquía de páginas, encabezados y acciones primarias/secundarias.

### 8.4 Iconografía e imagen

- reglas de uso y tamaño de Lucide;
- iconos propios imprescindibles, si los hay;
- estilo de ilustración y empty states;
- dirección fotográfica: encuadre, luz, diversidad, acción, instalaciones y tratamiento de color;
- criterio para avatares, logos y banners de club;
- recursos que deben generarse y cuáles no son necesarios.

### 8.5 Motion y feedback

- duraciones y curvas para hover, press, apertura, cambio de vista, carga y confirmación;
- microinteracciones vinculadas a reserva, pago, unión a partida y progreso;
- skeletons, optimistic feedback y toasts;
- respeto de `prefers-reduced-motion`;
- nada debe animarse solo para “parecer premium”.

## 9. Componentes y estados

Define y muestra como mínimo:

- botones, icon buttons, split buttons y acciones destructivas;
- inputs, búsqueda, selects, date/time pickers, color picker y carga de imágenes;
- tabs, filtros, chips, badges, tooltips, popovers, menús y breadcrumbs;
- sidebar, topbar, navegación móvil y navegación del club;
- cards, list items, stat blocks y módulos sin contenedor;
- tablas responsive, filas expandibles, ordenación, selección y bulk actions;
- calendario, grid de pistas, slots, reservas, bloqueos y leyenda;
- charts, KPIs, tendencias y estados de datos insuficientes;
- modal, sheet, drawer y confirmación;
- alertas, banners, toast, notificación y centro de actividad;
- jugador/avatar, ranking, podium, ficha de partida, chat y valoración;
- empty, loading, skeleton, error, offline, sin resultados, permisos, trial y suscripción caducada;
- foco, hover, active, pressed, selected, disabled, read-only y validation.

Para cada componente esencial especifica anatomía, variantes, tamaños, estados, comportamiento responsive, accesibilidad y cuándo usarlo.

## 10. Pantallas de alta fidelidad obligatorias

Usa contenido realista en español —nombres, pistas, horarios, importes, estados y métricas—, nunca lorem ipsum. Mantén las capacidades reales del producto. Puedes mejorar jerarquía, navegación y presentación, pero no inventar funciones estructurales que oculten los flujos existentes.

### 10.1 Plataforma / superadmin

1. Vista global de clubes con búsqueda, filtros, estado de suscripción, plan, trial, demos y acciones.
2. Detalle/resumen de un club desde perspectiva de plataforma.
3. Estado vacío, error y acción sensible de administración.

### 10.2 Administración de club

1. Dashboard principal con KPIs, ocupación, agenda, ingresos, pendientes y acciones rápidas.
2. Reservas en vista semanal por pistas, con disponibilidad, bloqueos, partidas abiertas, pagado/pendiente y selección de slot.
3. Modal/drawer de creación o edición de reserva.
4. Socios en tabla y detalle de socio.
5. Analítica con gráficos legibles y filtros temporales.
6. Competiciones/rankings o comunicación masiva.
7. Ajustes de identidad del club con previsualización y comprobación de contraste.
8. Onboarding y estado de trial/suscripción.

### 10.3 Jugador / portal del club

1. Home del club con identidad tenant, próxima reserva, acciones principales, actividad y noticias.
2. Reserva de pista: selección de fecha, grid de slots, precio, disponibilidad y leyenda.
3. Confirmación y pago de reserva, incluyendo éxito y fallo recuperable.
4. Partidas abiertas: listado, detalle, unión y estado de plazas.
5. Rankings/competición con posición personal.
6. Perfil del jugador con estadísticas, historial, reservas y ajustes.
7. Directorio o ficha social de jugador, chat y valoración.
8. Login/registro del club.
9. Empty/offline/lista de espera/cancelación o reagendado.

### 10.4 Frames mínimos

- todas las pantallas núcleo de administración a 1440 px;
- reservas administrativas también a 1024 px;
- todas las pantallas núcleo de jugador a 390 px;
- home y reserva de jugador también a 1440 px;
- al menos una pantalla representativa de cada contexto en modo oscuro;
- anotaciones responsive para 360, 768, 1024 y 1440 px.

## 11. UX, accesibilidad y contenido

La estética solo se aprueba si mejora o conserva la usabilidad.

- Cumple WCAG 2.2 AA en contraste, foco, teclado, zoom y estados.
- Objetivos táctiles de al menos 44 × 44 px cuando el contexto móvil lo permita.
- No comuniques estado únicamente mediante color: combina texto, icono, patrón o forma.
- Diseña calendarios y gráficos para visión cromática diversa.
- Mantén orden de foco, skip links, labels, mensajes de error y nombres accesibles.
- Considera safe areas, PWA instalada, teclado móvil y navegación inferior.
- Define truncado, wrapping, tooltips y comportamiento para nombres largos.
- Redacta microcopy directa, humana y operacional; evita tono robótico o marketing dentro de tareas.
- Comprueba equivalencia visual ES/EN y expansión de texto.
- Diseña flujos críticos con reducción de errores: cobros, cancelación, eliminación, bloqueo, cambio de plan y acciones de plataforma.

## 12. Entregables

Organiza la entrega en este orden:

### A. Diagnóstico ejecutivo

- resumen de hallazgos;
- puntuación actual de 0 a 10 en identidad, coherencia, claridad, accesibilidad, móvil, datos densos y personalización tenant;
- capturas anotadas o referencias precisas a componentes/rutas;
- lista priorizada: conservar, evolucionar, retirar.

### B. Estrategia y concepto

- posicionamiento visual;
- audiencia y trabajos principales por portal;
- principios de diseño;
- tres territorios, matriz comparativa y selección de uno;
- narrativa de la dirección ganadora.

### C. Brand kit

- familia de marca completa;
- paleta y tipografía;
- motivo propietario y dirección de imagen;
- reglas de co-branding y marca tenant;
- ejemplos correctos e incorrectos.

### D. Design system

- foundations y tokens con nombres semánticos;
- tabla de componentes y estados;
- layouts, responsive, accesibilidad y motion;
- tokens listos para Tailwind/CSS variables en claro y oscuro;
- un archivo JSON o equivalente con tokens de referencia.

### E. Prototipo de alta fidelidad

- pantallas solicitadas, agrupadas por contexto y breakpoint;
- componentes reutilizables, no frames desconectados;
- interacciones clave enlazadas: reservar, pagar, unirse, crear reserva, filtrar y administrar club;
- estados vacíos, carga, error y éxito;
- nombres de frames y componentes claros.

Si tu entorno genera interfaces o código, crea un **showcase/prototipo aislado** del producto real y evita modificar lógica de negocio, APIs, base de datos o autenticación. No hagas una migración visual masiva en producción sin una fase separada de adopción. Si trabajas directamente en el repositorio, preserva todos los cambios existentes y sitúa los artefactos de propuesta en una zona claramente aislada.

### F. Handoff y adopción

- especificaciones medibles;
- correspondencia entre componente actual y componente propuesto;
- inventario de breaking changes visuales;
- plan de migración incremental por fases;
- orden recomendado: foundations, shell/navigation, componentes, flujos críticos, resto de módulos;
- criterios de QA visual y accesible;
- riesgos y mitigaciones;
- estimación relativa S/M/L por bloque, sin inventar fechas.

## 13. Formato técnico de tokens

Además de la representación visual, entrega una propuesta implementable con esta separación conceptual:

```text
primitive.*        valores base de color, espacio, radio, tipografía y motion
semantic.*         background, foreground, surface, border, focus, action, status
platform.*         acentos exclusivos de la operación de plataforma
admin.*            densidad y decisiones específicas del backoffice del club
player.*           navegación, touch y superficies específicas del jugador
tenant.*           primary, on-primary, tonal scale, logo y media del club
dataViz.*          series, comparación, objetivo, positivo, negativo y neutral
```

Incluye el mapeo propuesto a las variables existentes (`--background`, `--foreground`, `--primary`, `--card`, `--border`, `--sidebar-*`, etc.) y señala qué variables nuevas hacen falta. El sistema debe poder adoptarse progresivamente sin reescribir toda la aplicación de una vez.

## 14. Criterios de aceptación

Antes de presentar el resultado final, haz una revisión interna y no lo des por terminado hasta que se cumpla todo lo siguiente:

1. La interfaz es reconocible como PadelClub OS incluso sin leer el logotipo.
2. Los tres contextos se perciben como familia, pero no como la misma plantilla repetida.
3. El admin mejora la velocidad de lectura y acción en datos densos.
4. El jugador recibe una experiencia móvil genuina, no una adaptación tardía de escritorio.
5. La marca de un club puede convivir con la plataforma sin romper contraste ni consistencia.
6. Calendarios, tablas, gráficos, precios y estados siguen siendo más claros que antes.
7. La propuesta funciona en claro, oscuro, responsive y ES/EN.
8. No hay dependencia de modas visuales pasajeras ni de clichés del pádel.
9. Todos los elementos críticos tienen estados y especificaciones de interacción.
10. El handoff puede implementarse con el stack actual y una migración incremental.
11. La accesibilidad se demuestra con decisiones concretas, no con una declaración genérica.
12. La dirección ganadora supera al estado actual en la matriz de evaluación y explica por qué.

## 15. Forma de trabajo y nivel de exigencia

- Trabaja de lo sistémico a lo particular: primero identidad y reglas, después pantallas.
- Toma decisiones fundamentadas; no me devuelvas una lista de opciones sin recomendación.
- No pidas validación para decisiones menores. Solo pregunta si existe un bloqueo real que cambie el alcance.
- Distingue con claridad hallazgos observados, hipótesis e ideas nuevas.
- No prometas ser “el mejor del sector”: demuestra la ambición mediante calidad, coherencia y criterios comparables.
- No inventes investigación con usuarios ni métricas inexistentes.
- No ocultes problemas del producto actual; conviértelos en prioridades de diseño.
- Conserva la funcionalidad y el modelo de permisos. No alteres reglas de negocio para hacer más sencilla una maqueta.
- Usa datos plausibles del contexto de clubes de pádel españoles: euros, formatos horarios, nombres de pistas y estados reales.
- Presenta una solución suficientemente detallada para que diseño e ingeniería puedan implementarla sin reinterpretar la intención visual.

Tu entrega final debe cerrar con:

1. una vista resumida de la identidad ganadora;
2. las cinco decisiones que más diferencian a PadelClub OS;
3. los cinco cambios de mayor impacto frente al producto actual;
4. los próximos pasos exactos para llevar la propuesta a producción;
5. una checklist final de cumplimiento de todos los criterios de aceptación.

## FIN DEL PROMPT

