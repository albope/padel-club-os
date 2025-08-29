# Contexto del Proyecto: Padel Club OS

Este documento sirve como la única fuente de verdad para la IA (Gemini) sobre la arquitectura, stack tecnológico y objetivos del proyecto Padel Club OS.

## 1. Objetivo del Proyecto

"Padel Club OS" es una aplicación web full-stack construida con Next.js, diseñada como un SaaS para la gestión completa de clubes de pádel. El sistema permite a los administradores del club gestionar la operativa diaria (reservas, pistas, socios), dinamizar la comunidad a través de competiciones multiformato y un sistema de partidas abiertas (Play!), y configurar los ajustes generales del club.

## 2. Stack Tecnológico

- **Framework Principal**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: PostgreSQL
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **Estilos**: Tailwind CSS
- **Formularios**: React Hook Form & Zod

## 3. Estructura y Archivos Clave

- **`prisma/`**: Contiene el `schema.prisma`, que es el plano de nuestra base de datos.
- **`src/app/`**: Define la estructura de rutas y páginas visibles de la aplicación.
    - **`src/app/dashboard/`**: Páginas del panel de administración (Server Components para la carga de datos).
    - **`src/app/api/`**: El Backend. Aquí reside toda la lógica de negocio y la comunicación con la base de datos.
- **`src/components/`**: Contiene todos nuestros componentes de UI reutilizables (Client Components para la interactividad).
- **`src/lib/`**: Lógica y configuración compartida (`db.ts`, `auth.ts`).

## 4. Flujos de Negocio Principales

- **Registro y Creación del Club**: Un nuevo administrador se registra. La API (`/api/register`) crea en una transacción atómica el `User` y su `Club` asociado, estableciendo el entorno inicial.
- **Creación de una Reserva**: El admin abre el `BookingModal` desde el `ReservasContainer`. Al enviar, se llama a la API (`/api/bookings`) que valida el solapamiento de horarios antes de crear la `Booking` en la base de datos.
- **Ciclo de Vida de una Competición**:
    1.  El admin crea una `Competition` con un formato específico.
    2.  Añade `Team`s a través del `AddTeamModal`.
    3.  Usa la acción "Generar Calendario", que llama a la API (`/api/competitions/.../generate-matches`).
    4.  El backend resetea todas las estadísticas de los equipos a cero y genera los nuevos `Match`.
- **Registro de un Resultado**: El admin introduce un resultado en la `CompetitionDetailClient`. Esto llama a la API (`/api/competitions/.../matches/[matchId]`), que parsea el resultado de forma robusta, actualiza el `Match` y recalcula y actualiza las estadísticas del `Team` correspondiente en una transacción.
- **Creación de Partida Abierta**: El admin usa el `AddPartidaForm`. Al enviar, la API (`/api/open-matches`) crea en una transacción una `Booking` con estado `provisional` y la `OpenMatch` asociada con sus jugadores iniciales.

## 5. Guía de Estilo y Patrones Arquitectónicos

- **Server Components para datos, Client Components para interacción**.
- **La lógica de negocio crítica SIEMPRE reside en la capa de API**.
- **Uso de `db.$transaction`** para operaciones de base de datos complejas.
- **Prioridad a Componentes Pequeños y Enfocados** para facilitar el desarrollo ("vibecoding").
- **Generación de Bloques de Código Completos**: Se solicitarán siempre los archivos completos a la IA para asegurar la coherencia.

## 6. Puntos de Intervención (Tareas para Gemini)

### Roadmap General
El objetivo principal es completar y pulir el panel de administración antes de abordar funcionalidades para el socio.
1.  **Completar funcionalidades del Panel de Admin** (basado en el backlog de abajo).
2.  **Integración de Pagos (Stripe)**: Activar la monetización para reservas y cuotas de socio.
3.  **Sistema de Notificaciones**: Implementar el envío de emails para recordatorios y confirmaciones.
4.  **Testing Automatizado**: Introducir un framework de testing para asegurar la calidad del código.
5.  **Futuro a largo plazo**: Desarrollo del Portal del Jugador.

### Backlog de Tareas Específicas (Issues de GitHub)

#### **Competiciones**
- [ ] **#34**: Destacar visualmente el nombre del equipo ganador en la vista de torneo por eliminatorias.
- [ ] **#34**: Añadir un estado "Finalizado" a las competiciones y mostrarlo en la vista principal.
- [ ] **#33**: (Bug) Revisar y mejorar cómo se muestran los resultados en el bracket del torneo por eliminatorias.
- [ ] **#32**: Implementar la funcionalidad para eliminar un resultado ya introducido en todos los formatos de torneo.
- [ ] **#13**: Al crear una liga, dar la opción de que sea a "ida" o "ida y vuelta".

#### **Partidas Abiertas (Play!)**
- [ ] **#36**: Añadir un botón para compartir una partida abierta por WhatsApp.

#### **Socios**
- [ ] **#26**: Implementar la funcionalidad de importar socios masivamente desde un archivo CSV o TXT.

#### **Reservas y Ajustes**
- [ ] **#20**: Implementar el envío de un email recordatorio 24 horas antes de una reserva.
- [ ] **#19**: En la página de "Ajustes del Club", añadir campos para configurar los días de apertura de la semana.
- [ ] **#19**: Añadir un interruptor en "Ajustes del Club" para activar o desactivar globalmente el sistema de "Partidas Abiertas".

#### **Backend y Monetización**
- [ ] **#25**: Revisar e implementar la lógica de negocio para los campos `subscriptionTier` y `stripeCustomerId` en el modelo `Club` para preparar la integración de pagos.