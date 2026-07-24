// src/lib/demo-club.ts - Creacion y borrado de clubes demo (generador de demos).
//
// Usado por:
//   - scripts/seed-demo-club.ts (CLI)
//   - /api/platform/demo-clubs (backoffice SUPER_ADMIN)
//
// Todas las fechas se construyen ancladas a Europe/Madrid para que el resultado
// sea identico ejecutando desde local (CET/CEST) o desde Vercel (UTC).
// Los usuarios creados usan el namespace de email "@{slug}.demo": nunca colisionan
// con usuarios reales y permiten un borrado seguro por sufijo.

import { UserRole, OpenMatchStatus, type PrismaClient, type Prisma } from "@prisma/client"
import { hash } from "bcrypt"
import { randomBytes } from "node:crypto"
import { partesEnZonaClub, instanteDesdeZonaClub } from "./timezone"

// --- Configuracion y resultado ---

export interface ConfigClubDemo {
  clubName: string
  slug?: string
  numCourts?: number // 1-8, default 2
  numPlayers?: number // 4-12, default 12
  adminPassword?: string
  playerPassword?: string
}

export interface ResultadoClubDemo {
  clubId: string
  clubName: string
  slug: string
  adminEmail: string
  adminPassword: string
  playerEmail: string
  playerName: string
  playerPassword: string
  contadores: {
    pistas: number
    socios: number
    reservas: number
    partidas: number
    noticias: number
    pagos: number
  }
}

export function slugifyClub(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function passwordAleatoria(): string {
  return randomBytes(9).toString("base64url")
}

// --- Precios (por hora y pista, misma convencion que src/lib/pricing.ts) ---

const HORA_APERTURA = 9
const HORA_CIERRE = 22
const DURACION_MIN = 90

function precioHora(dayOfWeek: number, hora: number): number {
  const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6
  if (esFinDeSemana) return 12
  return hora >= 17 ? 14 : 10
}

function calcularPrecio(dayOfWeek: number, startDec: number, endDec: number): number {
  let total = 0
  for (let h = HORA_APERTURA; h < HORA_CIERRE; h++) {
    const inicioSolape = Math.max(h, startDec)
    const finSolape = Math.min(h + 1, endDec)
    const horas = finSolape - inicioSolape
    if (horas > 0) total += horas * precioHora(dayOfWeek, h)
  }
  return Math.round(total * 100) / 100
}

// Escalera de slots de 90 min sin solapes dentro del horario 9-22
const SLOTS: Array<{ h: number; m: number }> = [
  { h: 9, m: 0 },
  { h: 10, m: 30 },
  { h: 12, m: 0 },
  { h: 13, m: 30 },
  { h: 15, m: 0 },
  { h: 16, m: 30 },
  { h: 18, m: 0 },
  { h: 19, m: 30 },
]

const SOCIOS_BASE = [
  { name: "Xoán Rodríguez", email: "xoan", phone: "+34 611 210 101", level: "3.5", position: "Revés" },
  { name: "Antía Blanco", email: "antia", phone: "+34 622 210 102", level: "4.0", position: "Drive" },
  { name: "Brais Vázquez", email: "brais", phone: "+34 633 210 103", level: "3.0", position: "Revés" },
  { name: "Uxía Álvarez", email: "uxia", phone: "+34 644 210 104", level: "3.5", position: "Drive" },
  { name: "Iago Prada", email: "iago", phone: "+34 655 210 105", level: "4.5", position: "Revés" },
  { name: "Noa Losada", email: "noa", phone: "+34 666 210 106", level: "2.5", position: "Drive" },
  { name: "Martiño Fernández", email: "martino", phone: "+34 677 210 107", level: "3.0", position: "Revés" },
  { name: "Sabela González", email: "sabela", phone: "+34 688 210 108", level: "3.5", position: "Drive" },
  { name: "Roi Domínguez", email: "roi", phone: "+34 699 210 109", level: "4.0", position: "Revés" },
  { name: "Iria Castro", email: "iria", phone: "+34 600 210 110", level: "2.5", position: "Drive" },
  { name: "Breogán Seoane", email: "breogan", phone: "+34 600 210 111", level: "3.0", position: "Revés" },
  { name: "Catuxa Otero", email: "catuxa", phone: "+34 600 210 112", level: "3.5", position: "Drive" },
]

/**
 * Crea un club demo completo (club, admin, pistas, precios, socios, stats,
 * reservas, partidas, noticias, pagos y una clase recurrente).
 *
 * Lanza Error con message "SLUG_EXISTE" si ya hay un club con ese slug.
 * No envia ningun email (los usuarios demo no tienen buzon real).
 */
export async function crearClubDemo(
  prisma: PrismaClient,
  config: ConfigClubDemo
): Promise<ResultadoClubDemo> {
  const clubName = config.clubName.trim()
  const slug = (config.slug?.trim() || slugifyClub(clubName)).toLowerCase()
  const numCourts = Math.min(8, Math.max(1, config.numCourts ?? 2))
  const numPlayers = Math.min(SOCIOS_BASE.length, Math.max(4, config.numPlayers ?? 12))
  const adminPassword = config.adminPassword || passwordAleatoria()
  const playerPassword = config.playerPassword || passwordAleatoria()
  const dominioEmail = `${slug}.demo`
  const adminEmail = `admin@${dominioEmail}`

  if (!slug) throw new Error("SLUG_INVALIDO")

  const existente = await prisma.club.findUnique({ where: { slug }, select: { id: true } })
  if (existente) throw new Error("SLUG_EXISTE")

  // Base de calendario: "hoy" segun la zona del club
  const ahora = new Date()
  const base = partesEnZonaClub(ahora)

  /** Dia de la semana (0=domingo) de hoy+dias, segun calendario del club */
  function diaSemana(diasDesdeHoy: number): number {
    return new Date(Date.UTC(base.year, base.month - 1, base.day + diasDesdeHoy)).getUTCDay()
  }

  /** Instante UTC cuya hora de pared en la zona del club es hora:minuto de hoy+dias */
  function fecha(diasDesdeHoy: number, hora: number, minuto = 0): Date {
    return instanteDesdeZonaClub(base.year, base.month, base.day + diasDesdeHoy, hora, minuto)
  }

  function finSlot(inicio: Date): Date {
    return new Date(inicio.getTime() + DURACION_MIN * 60 * 1000)
  }

  function precioSlot(dias: number, h: number, m: number): number {
    const startDec = h + m / 60
    return calcularPrecio(diaSemana(dias), startDec, startDec + DURACION_MIN / 60)
  }

  const [passwordAdminHash, passwordSociosHash] = await Promise.all([
    hash(adminPassword, 10),
    hash(playerPassword, 10),
  ])
  const trialEndsAt = new Date(ahora.getTime() + 90 * 24 * 60 * 60 * 1000)
  const verifiedAt = new Date()

  const nombresPistas =
    numCourts === 2
      ? [
          { name: "Pista 1 - Cubierta", type: "Indoor" },
          { name: "Pista 2 - Exterior", type: "Outdoor" },
        ]
      : Array.from({ length: numCourts }, (_, i) => ({
          name: `Pista ${i + 1}`,
          type: i % 2 === 0 ? "Indoor" : "Outdoor",
        }))

  // --- 1. Club + admin + pistas (transaccion atomica) ---
  const { club, pistas } = await prisma.$transaction(async (tx) => {
    const club = await tx.club.create({
      data: {
        name: clubName,
        slug,
        esDemo: true,
        description: `Club demo de ${clubName}. Reserva online, partidas abiertas y gestión sin papeles.`,
        phone: "+34 900 000 000",
        email: `info@${dominioEmail}`,
        openingTime: "09:00",
        closingTime: "22:00",
        primaryColor: "#0369a1",
        maxAdvanceBooking: 14,
        cancellationHours: 24,
        enableOpenMatches: true,
        enablePlayerBooking: true,
        bookingDuration: DURACION_MIN,
        bookingPaymentMode: "presential",
        subscriptionTier: "pro",
        subscriptionStatus: "active",
        trialEndsAt,
        timezone: "Europe/Madrid",
        registrationMode: "CLOSED",
        isPublished: true,
        onboardingCompletedAt: verifiedAt,
        bannerUrl: "/images/defaults/club-hero.webp",
        logoUrl: "/images/defaults/club-hero.webp",
      },
    })

    const admin = await tx.user.create({
      data: {
        name: "Administración",
        email: adminEmail,
        password: passwordAdminHash,
        role: UserRole.CLUB_ADMIN,
        clubId: club.id,
        emailVerified: verifiedAt,
        image: "/images/defaults/player.webp",
      },
    })
    await tx.clubMembership.create({
      data: {
        userId: admin.id,
        clubId: club.id,
        role: UserRole.CLUB_ADMIN,
        status: "ACTIVE",
        approvedAt: verifiedAt,
      },
    })

    const pistas = []
    for (const p of nombresPistas) {
      pistas.push(await tx.court.create({ data: { ...p, clubId: club.id } }))
    }
    return { club, pistas }
  })

  // --- 2. Precios por pista (bandas que cubren todo el horario) ---
  const preciosInserts = []
  for (const pista of pistas) {
    for (let dia = 0; dia <= 6; dia++) {
      for (let hora = HORA_APERTURA; hora < HORA_CIERRE; hora++) {
        preciosInserts.push({
          courtId: pista.id,
          dayOfWeek: dia,
          startHour: hora,
          endHour: hora + 1,
          price: precioHora(dia, hora),
          clubId: club.id,
        })
      }
    }
  }
  await prisma.courtPricing.createMany({ data: preciosInserts, skipDuplicates: true })

  // --- 3. Socios (createManyAndReturn: 1 sola query) ---
  const sociosData = SOCIOS_BASE.slice(0, numPlayers)
  const sociosCreados = await prisma.user.createManyAndReturn({
    data: sociosData.map((s) => ({
      name: s.name,
      email: `${s.email}@${dominioEmail}`,
      password: passwordSociosHash,
      phone: s.phone,
      level: s.level,
      position: s.position,
      role: UserRole.PLAYER,
      clubId: club.id,
      emailVerified: verifiedAt,
      image: "/images/defaults/player.webp",
    })),
    select: { id: true, email: true },
  })
  // Orden estable: mapear por email
  const socios = sociosData.map((s) => {
    const creado = sociosCreados.find((c) => c.email === `${s.email}@${dominioEmail}`)
    if (!creado) throw new Error(`Socio no creado: ${s.email}`)
    return { id: creado.id, level: s.level }
  })
  await prisma.clubMembership.createMany({
    data: socios.map((socio) => ({
      userId: socio.id,
      clubId: club.id,
      role: UserRole.PLAYER,
      status: "ACTIVE",
      approvedAt: verifiedAt,
    })),
    skipDuplicates: true,
  })

  // --- 4. Estadisticas ELO (coherentes con eloANivel: elo = 900 + (nivel-1)*200) ---
  await prisma.playerStats.createMany({
    data: socios.map((socio) => {
      const nivel = parseFloat(socio.level)
      const partidos = 8 + Math.floor(Math.random() * 22)
      const ganados = Math.floor(partidos * (0.3 + Math.random() * 0.4))
      return {
        userId: socio.id,
        clubId: club.id,
        eloRating: 900 + (nivel - 1) * 200 + Math.floor(Math.random() * 80 - 40),
        matchesPlayed: partidos,
        matchesWon: ganados,
        setsWon: ganados * 2 + Math.floor(Math.random() * 8),
        setsLost: (partidos - ganados) * 2 + Math.floor(Math.random() * 5),
        gamesWon: ganados * 12 + Math.floor(Math.random() * 25),
        gamesLost: (partidos - ganados) * 10 + Math.floor(Math.random() * 20),
        winStreak: Math.floor(Math.random() * 4),
        bestWinStreak: 2 + Math.floor(Math.random() * 6),
      }
    }),
    skipDuplicates: true,
  })

  // --- 5. Clase fija (recurrente) los miercoles 18:00-19:30 en la pista 1 ---
  const recurrente = await prisma.recurringBooking.create({
    data: {
      description: "Escuela de pádel - miércoles 18:00",
      dayOfWeek: 3,
      startHour: 18,
      startMinute: 0,
      endHour: 19,
      endMinute: 30,
      isActive: true,
      startsAt: fecha(0, 0, 0),
      endsAt: new Date(ahora.getTime() + 90 * 24 * 60 * 60 * 1000),
      courtId: pistas[0].id,
      guestName: "Escuela de pádel",
      clubId: club.id,
    },
  })

  // --- 6. Reservas ---
  const reservaKeys = new Set<string>()
  function reservarSlot(courtId: string, inicio: Date): boolean {
    const key = `${courtId}-${inicio.toISOString()}`
    if (reservaKeys.has(key)) return false
    reservaKeys.add(key)
    return true
  }

  function socioAleatorio(): string {
    return socios[Math.floor(Math.random() * socios.length)].id
  }

  const reservasData: Prisma.BookingCreateManyInput[] = []

  // 6a. Clases de la escuela pre-generadas (proximos 7 dias; el cron es idempotente)
  for (let dia = 0; dia <= 7; dia++) {
    if (diaSemana(dia) !== 3) continue
    const d = fecha(dia, 18, 0)
    if (d < ahora) continue
    if (!reservarSlot(pistas[0].id, d)) continue
    reservasData.push({
      startTime: d,
      endTime: finSlot(d),
      totalPrice: precioSlot(dia, 18, 0),
      courtId: pistas[0].id,
      guestName: "Escuela de pádel",
      clubId: club.id,
      status: "confirmed",
      paymentStatus: "exempt",
      paymentMethod: "exempt",
      numPlayers: 4,
      recurringBookingId: recurrente.id,
    })
  }

  // 6b. Partidas abiertas: reservar sus huecos para que no colisionen
  const pistaPartidaHoy = pistas[pistas.length - 1]
  const inicioPartidaHoy = fecha(0, 19, 30)
  reservarSlot(pistaPartidaHoy.id, inicioPartidaHoy)
  const inicioPartidaFutura = fecha(2, 16, 30)
  reservarSlot(pistas[0].id, inicioPartidaFutura)

  // 6c. Reservas de hoy (ocupacion visible en la demo)
  const reservasHoy: Array<{ pista: number; h: number; m: number }> = [
    { pista: 0, h: 10, m: 30 },
    { pista: 1, h: 12, m: 0 },
    { pista: 1, h: 16, m: 30 },
    { pista: 0, h: 18, m: 0 },
    { pista: 1, h: 18, m: 0 },
    { pista: 0, h: 19, m: 30 },
  ]
  for (const r of reservasHoy) {
    const pista = pistas[r.pista % pistas.length]
    const inicio = fecha(0, r.h, r.m)
    if (!reservarSlot(pista.id, inicio)) continue
    reservasData.push({
      startTime: inicio,
      endTime: finSlot(inicio),
      totalPrice: precioSlot(0, r.h, r.m),
      courtId: pista.id,
      userId: socioAleatorio(),
      clubId: club.id,
      status: "confirmed",
      paymentStatus: "pending",
      paymentMethod: "presential",
      numPlayers: 4,
    })
  }

  // 6d. Reservas pasadas (ultimos 21 dias)
  for (let dia = -21; dia < 0; dia++) {
    const esFinDeSemana = diaSemana(dia) === 0 || diaSemana(dia) === 6
    const numReservas = (esFinDeSemana ? 3 : 2) + Math.floor(Math.random() * 2)
    const slotsBarajados = [...SLOTS].sort(() => Math.random() - 0.5).slice(0, numReservas)
    for (const slot of slotsBarajados) {
      const pista = pistas[Math.floor(Math.random() * pistas.length)]
      const inicio = fecha(dia, slot.h, slot.m)
      if (!reservarSlot(pista.id, inicio)) continue
      reservasData.push({
        startTime: inicio,
        endTime: finSlot(inicio),
        totalPrice: precioSlot(dia, slot.h, slot.m),
        courtId: pista.id,
        userId: socioAleatorio(),
        clubId: club.id,
        status: "confirmed",
        paymentStatus: Math.random() > 0.25 ? "paid" : "exempt",
        paymentMethod: "presential",
        numPlayers: 4,
      })
    }
  }

  // 6e. Reservas futuras (proximos 7 dias)
  for (let dia = 1; dia <= 7; dia++) {
    const numReservas = 2 + Math.floor(Math.random() * 2)
    const slotsBarajados = [...SLOTS].sort(() => Math.random() - 0.5).slice(0, numReservas)
    for (const slot of slotsBarajados) {
      const pista = pistas[Math.floor(Math.random() * pistas.length)]
      const inicio = fecha(dia, slot.h, slot.m)
      if (!reservarSlot(pista.id, inicio)) continue
      reservasData.push({
        startTime: inicio,
        endTime: finSlot(inicio),
        totalPrice: precioSlot(dia, slot.h, slot.m),
        courtId: pista.id,
        userId: socioAleatorio(),
        clubId: club.id,
        status: "confirmed",
        paymentStatus: "pending",
        paymentMethod: "presential",
        numPlayers: 4,
      })
    }
  }

  // 6f. Un par de canceladas (historial realista)
  const cancelaciones = [
    { dia: -4, h: 15, m: 0, motivo: "Lluvia - pista exterior impracticable" },
    { dia: -9, h: 10, m: 30, motivo: "Imprevisto del jugador" },
  ]
  for (const c of cancelaciones) {
    const pista = pistas[pistas.length - 1]
    const inicio = fecha(c.dia, c.h, c.m)
    if (!reservarSlot(pista.id, inicio)) continue
    reservasData.push({
      startTime: inicio,
      endTime: finSlot(inicio),
      totalPrice: precioSlot(c.dia, c.h, c.m),
      courtId: pista.id,
      userId: socioAleatorio(),
      clubId: club.id,
      status: "cancelled",
      paymentStatus: "exempt",
      paymentMethod: "presential",
      numPlayers: 4,
      cancelledAt: new Date(inicio.getTime() - 24 * 60 * 60 * 1000),
      cancelReason: c.motivo,
    })
  }

  const reservas = await prisma.booking.createMany({ data: reservasData, skipDuplicates: true })

  // --- 7. Partidas abiertas (hoy: falta 1 jugador) ---
  const partidaHoy = await prisma.openMatch.create({
    data: {
      matchTime: inicioPartidaHoy,
      status: OpenMatchStatus.OPEN,
      levelMin: 3.0,
      levelMax: 4.0,
      courtId: pistaPartidaHoy.id,
      clubId: club.id,
    },
  })
  const partidaFutura = await prisma.openMatch.create({
    data: {
      matchTime: inicioPartidaFutura,
      status: OpenMatchStatus.OPEN,
      levelMin: 2.5,
      levelMax: 3.5,
      courtId: pistas[0].id,
      clubId: club.id,
    },
  })
  await prisma.openMatchPlayer.createMany({
    data: [
      { openMatchId: partidaHoy.id, userId: socios[0].id },
      { openMatchId: partidaHoy.id, userId: socios[1].id },
      { openMatchId: partidaHoy.id, userId: socios[3].id },
      { openMatchId: partidaFutura.id, userId: socios[2].id },
      { openMatchId: partidaFutura.id, userId: socios[5 % socios.length].id },
    ],
    skipDuplicates: true,
  })

  // --- 8. Noticias ---
  const noticias = [
    {
      title: "Ya puedes reservar pista online",
      content:
        "Estrenamos sistema de reservas online. A partir de ahora puedes reservar pista desde el móvil las 24 horas, ver la disponibilidad en tiempo real y cancelar hasta 24 horas antes sin coste.\n\nEntra en la sección Reservar, elige pista y hora, y listo. Sin llamadas ni mensajes.",
      published: true,
      clubId: club.id,
      imageUrl: "/images/defaults/news.webp",
    },
    {
      title: "Torneo de verano - inscripciones abiertas",
      content:
        "Abrimos las inscripciones para el Torneo de Verano del club. Formato por parejas, todas las categorías bienvenidas.\n\nFechas: último fin de semana de agosto.\nPrecio: 10€ por pareja (incluye bolas y picoteo).\n\nApúntate en recepción o escríbenos.",
      published: true,
      clubId: club.id,
      imageUrl: "/images/defaults/news.webp",
    },
    {
      title: "Nuevo horario de verano",
      content:
        "Durante los meses de verano el club abre de 9:00 a 22:00 todos los días.\n\nLas horas con más demanda son las de tarde (18:00 a 21:30); os recomendamos reservar con antelación desde la app.",
      published: true,
      clubId: club.id,
      imageUrl: "/images/defaults/news.webp",
    },
  ]
  await prisma.news.createMany({ data: noticias })

  // --- 9. Pagos de reservas pasadas pagadas ---
  const reservasPagadas = await prisma.booking.findMany({
    where: { clubId: club.id, paymentStatus: "paid", status: "confirmed" },
    select: { id: true, totalPrice: true, userId: true },
  })
  await prisma.payment.createMany({
    data: reservasPagadas.map((r) => ({
      amount: r.totalPrice,
      currency: "EUR",
      status: "succeeded",
      type: "booking",
      bookingId: r.id,
      userId: r.userId,
      clubId: club.id,
    })),
    skipDuplicates: true,
  })

  return {
    clubId: club.id,
    clubName,
    slug,
    adminEmail,
    adminPassword,
    playerEmail: `${sociosData[0].email}@${dominioEmail}`,
    playerName: sociosData[0].name,
    playerPassword,
    contadores: {
      pistas: pistas.length,
      socios: socios.length,
      reservas: reservas.count,
      partidas: 2,
      noticias: noticias.length,
      pagos: reservasPagadas.length,
    },
  }
}

/**
 * Borra un club demo y sus usuarios del namespace "@{slug}.demo".
 *
 * Guarda de seguridad: solo borra clubes con esDemo = true.
 * Lanza Error "CLUB_NO_ENCONTRADO" o "NO_ES_DEMO".
 */
export async function borrarClubDemo(
  prisma: PrismaClient,
  slug: string
): Promise<{ usuariosBorrados: number }> {
  const club = await prisma.club.findUnique({
    where: { slug },
    select: { id: true, esDemo: true },
  })
  if (!club) throw new Error("CLUB_NO_ENCONTRADO")
  if (!club.esDemo) throw new Error("NO_ES_DEMO")

  // Borrar el club primero: el cascade elimina pistas, reservas, precios, partidas,
  // noticias, pagos, stats y recurrentes. Los users quedan con clubId = null (SetNull)
  // y se borran despues por su namespace de email.
  await prisma.club.delete({ where: { id: club.id } })
  const borrados = await prisma.user.deleteMany({
    where: { email: { endsWith: `@${slug}.demo` } },
  })
  return { usuariosBorrados: borrados.count }
}
