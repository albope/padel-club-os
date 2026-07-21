// scripts/seed-demo-club.ts - Crea un club demo completo y parametrizable desde cero.
//
// Uso:
//   npx tsx scripts/seed-demo-club.ts [opciones]
//
// Opciones:
//   --name "Club Náutico Viana do Bolo"   Nombre del club (default)
//   --slug club-nautico-viana-do-bolo     Slug (default: derivado del nombre)
//   --courts 2                            Número de pistas (1-8)
//   --players 12                          Número de socios (4-12)
//   --admin-password <pwd>                Password del admin (default: aleatoria)
//   --player-password <pwd>               Password de los socios (default: aleatoria)
//   --reset                               Borra el club demo existente y lo recrea
//   --delete                              Solo borra el club demo y sale
//   --confirm                             Obligatorio si DATABASE_URL no es localhost
//
// Seguridad: aborta si el slug ya existe (salvo --reset). Todos los usuarios
// creados usan el namespace de email "@{slug}.demo", de forma que el --reset
// solo puede borrar datos del propio club demo.

import { PrismaClient, UserRole, OpenMatchStatus, type User, type Court } from "@prisma/client"
import { hash } from "bcrypt"
import { randomBytes } from "node:crypto"

const prisma = new PrismaClient()

interface Args {
  name: string
  slug: string
  courts: number
  players: number
  adminPassword: string
  playerPassword: string
  reset: boolean
  delete: boolean
  confirm: boolean
}

function slugify(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function randomPassword(): string {
  return randomBytes(9).toString("base64url")
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    name: "Club Náutico Viana do Bolo",
    slug: "",
    courts: 2,
    players: 12,
    adminPassword: randomPassword(),
    playerPassword: randomPassword(),
    reset: false,
    delete: false,
    confirm: false,
  }

  for (let i = 2; i < argv.length; i++) {
    const flag = argv[i]
    const valor = argv[i + 1]
    switch (flag) {
      case "--name":
        args.name = valor
        i++
        break
      case "--slug":
        args.slug = valor
        i++
        break
      case "--courts":
        args.courts = parseInt(valor, 10)
        i++
        break
      case "--players":
        args.players = parseInt(valor, 10)
        i++
        break
      case "--admin-password":
        args.adminPassword = valor
        i++
        break
      case "--player-password":
        args.playerPassword = valor
        i++
        break
      case "--reset":
        args.reset = true
        break
      case "--delete":
        args.delete = true
        break
      case "--confirm":
        args.confirm = true
        break
      default:
        console.error(`❌ Opción desconocida: ${flag}`)
        process.exit(1)
    }
  }

  if (!args.slug) args.slug = slugify(args.name)
  if (!Number.isInteger(args.courts) || args.courts < 1 || args.courts > 8) {
    console.error("❌ --courts debe ser un entero entre 1 y 8")
    process.exit(1)
  }
  if (!Number.isInteger(args.players) || args.players < 4 || args.players > 12) {
    console.error("❌ --players debe ser un entero entre 4 y 12")
    process.exit(1)
  }
  return args
}

// --- Precios: mismas reglas que se insertan en CourtPricing (precio por hora y pista) ---
const HORA_APERTURA = 9
const HORA_CIERRE = 22

function precioHora(dayOfWeek: number, hora: number): number {
  const esFinDeSemana = dayOfWeek === 0 || dayOfWeek === 6
  if (esFinDeSemana) return 12
  return hora >= 17 ? 14 : 10
}

// Replica el cálculo proporcional de src/lib/pricing.ts para que el
// totalPrice sembrado coincida con lo que calcularía la app.
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

// Escalera de slots de 90 min (duración de reserva del club) sin solapes
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
const DURACION_MIN = 90

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

async function main() {
  const args = parseArgs(process.argv)
  const dominioEmail = `${args.slug}.demo`
  const adminEmail = `admin@${dominioEmail}`

  // --- Preflight: destino de la base de datos ---
  const dbUrl = process.env.DATABASE_URL
  if (!dbUrl) {
    console.error("❌ DATABASE_URL no está definida")
    process.exit(1)
  }
  let dbHost: string
  try {
    dbHost = new URL(dbUrl).hostname
  } catch {
    console.error("❌ DATABASE_URL no es una URL válida")
    process.exit(1)
  }
  const esLocal = dbHost === "localhost" || dbHost === "127.0.0.1"

  console.log("🎾 Seed de club demo")
  console.log(`   Base de datos: ${dbHost} ${esLocal ? "(local)" : "(REMOTA)"}`)
  console.log(`   Club: ${args.name} (slug: ${args.slug})`)
  console.log(`   Pistas: ${args.courts} | Socios: ${args.players} | Reset: ${args.reset ? "sí" : "no"}`)

  if (!esLocal && !args.confirm) {
    console.error("\n❌ DATABASE_URL apunta a una base de datos remota.")
    console.error("   Añade --confirm para ejecutar contra esta base de datos.")
    process.exit(1)
  }

  // --- Modo borrado: eliminar el club demo y salir ---
  const clubExistente = await prisma.club.findUnique({ where: { slug: args.slug } })
  if (args.delete) {
    if (!clubExistente) {
      console.error(`\n❌ No existe ningún club con slug "${args.slug}"`)
      process.exit(1)
    }
    await prisma.club.delete({ where: { id: clubExistente.id } })
    const borrados = await prisma.user.deleteMany({
      where: { email: { endsWith: `@${dominioEmail}` } },
    })
    console.log(`\n🗑️  Club "${args.slug}" y ${borrados.count} usuarios demo eliminados`)
    return
  }

  // --- Club existente: abortar o resetear ---
  if (clubExistente) {
    if (!args.reset) {
      console.error(`\n❌ Ya existe un club con slug "${args.slug}". Usa --reset para recrearlo.`)
      process.exit(1)
    }
    console.log("\n🗑️  Borrando club demo existente...")
    // Borrar el club primero: cascade elimina pistas, reservas, precios,
    // partidas, noticias, pagos, stats, recurrentes... Los users quedan con
    // clubId = null (SetNull) y se borran después por su namespace de email.
    await prisma.club.delete({ where: { id: clubExistente.id } })
    const borrados = await prisma.user.deleteMany({
      where: { email: { endsWith: `@${dominioEmail}` } },
    })
    console.log(`   Club y ${borrados.count} usuarios demo eliminados`)
  }

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  function fecha(diasDesdeHoy: number, h: number, m = 0): Date {
    const d = new Date(hoy)
    d.setDate(d.getDate() + diasDesdeHoy)
    d.setHours(h, m, 0, 0)
    return d
  }

  function finSlot(inicio: Date): Date {
    return new Date(inicio.getTime() + DURACION_MIN * 60 * 1000)
  }

  // --- 1. Club + admin + pistas (transacción atómica) ---
  const passwordAdminHash = await hash(args.adminPassword, 10)
  const passwordSociosHash = await hash(args.playerPassword, 10)
  const trialEndsAt = new Date(hoy.getTime() + 90 * 24 * 60 * 60 * 1000)

  const nombresPistas =
    args.courts === 2
      ? [
          { name: "Pista 1 - Cuberta", type: "Indoor" },
          { name: "Pista 2 - Exterior", type: "Outdoor" },
        ]
      : Array.from({ length: args.courts }, (_, i) => ({
          name: `Pista ${i + 1}`,
          type: i % 2 === 0 ? "Indoor" : "Outdoor",
        }))

  const { club, pistas } = await prisma.$transaction(async (tx) => {
    const club = await tx.club.create({
      data: {
        name: args.name,
        slug: args.slug,
        address: "Rúa do Porto 12, 32550 Viana do Bolo, Ourense",
        description:
          "Club deportivo con dúas pistas de pádel no corazón de Viana do Bolo. Reserva online, partidas abertas e ambiente familiar.",
        phone: "+34 988 340 120",
        email: "info@clubnauticoviana.demo",
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
      },
    })

    await tx.user.create({
      data: {
        name: "Fernando Hervella",
        email: adminEmail,
        password: passwordAdminHash,
        role: UserRole.CLUB_ADMIN,
        clubId: club.id,
      },
    })

    const pistas: Court[] = []
    for (const p of nombresPistas) {
      pistas.push(await tx.court.create({ data: { ...p, clubId: club.id } }))
    }
    return { club, pistas }
  })
  console.log(`\n✅ Club, admin y ${pistas.length} pistas creados`)

  // --- 2. Precios por pista (bandas horarias que cubren todo el horario) ---
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
  console.log(`✅ ${preciosInserts.length} bandas de precio creadas`)

  // --- 3. Socios ---
  const sociosData = SOCIOS_BASE.slice(0, args.players)
  const socios: User[] = []
  for (const s of sociosData) {
    socios.push(
      await prisma.user.create({
        data: {
          name: s.name,
          email: `${s.email}@${dominioEmail}`,
          password: passwordSociosHash,
          phone: s.phone,
          level: s.level,
          position: s.position,
          role: UserRole.PLAYER,
          clubId: club.id,
        },
      })
    )
  }
  console.log(`✅ ${socios.length} socios creados`)

  // --- 4. Estadísticas ELO ---
  await prisma.playerStats.createMany({
    data: socios.map((socio, i) => {
      const nivel = parseFloat(sociosData[i].level)
      const partidos = 8 + Math.floor(Math.random() * 22)
      const ganados = Math.floor(partidos * (0.3 + Math.random() * 0.4))
      return {
        userId: socio.id,
        clubId: club.id,
        // Inversa de eloANivel (src/lib/elo.ts): elo = 900 + (nivel-1)*200, con jitter ±0.2 niveles
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
  console.log(`✅ ${socios.length} estadísticas de jugador creadas`)

  // --- 5. Clase fija (reserva recurrente) los miércoles 18:00-19:30 ---
  const recurrente = await prisma.recurringBooking.create({
    data: {
      description: "Escola de pádel - mércores 18:00",
      dayOfWeek: 3,
      startHour: 18,
      startMinute: 0,
      endHour: 19,
      endMinute: 30,
      isActive: true,
      startsAt: hoy,
      endsAt: new Date(hoy.getTime() + 90 * 24 * 60 * 60 * 1000),
      courtId: pistas[0].id,
      guestName: "Escola de pádel",
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

  type ReservaInsert = {
    startTime: Date
    endTime: Date
    totalPrice: number
    courtId: string
    userId?: string
    guestName?: string
    clubId: string
    status: string
    paymentStatus: string
    paymentMethod: string
    numPlayers: number
    recurringBookingId?: string
    cancelledAt?: Date
    cancelReason?: string
  }
  const reservasData: ReservaInsert[] = []

  function precioSlot(inicio: Date): number {
    const startDec = inicio.getHours() + inicio.getMinutes() / 60
    return calcularPrecio(inicio.getDay(), startDec, startDec + DURACION_MIN / 60)
  }

  function socioAleatorio(): string {
    return socios[Math.floor(Math.random() * socios.length)].id
  }

  // 6a. Clases de la escola pre-generadas (próximos 7 días) — el cron es
  // idempotente y no las duplicará
  for (let dia = 0; dia <= 7; dia++) {
    const d = fecha(dia, 18, 0)
    if (d.getDay() !== 3 || d < new Date()) continue
    if (!reservarSlot(pistas[0].id, d)) continue
    reservasData.push({
      startTime: d,
      endTime: finSlot(d),
      totalPrice: precioSlot(d),
      courtId: pistas[0].id,
      guestName: "Escola de pádel",
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

  // 6c. Reservas de hoy (ocupación visible en la demo)
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
      totalPrice: precioSlot(inicio),
      courtId: pista.id,
      userId: socioAleatorio(),
      clubId: club.id,
      status: "confirmed",
      paymentStatus: "pending",
      paymentMethod: "presential",
      numPlayers: 4,
    })
  }

  // 6d. Reservas pasadas (últimos 21 días)
  for (let dia = -21; dia < 0; dia++) {
    const d = fecha(dia, 12, 0)
    const esFinDeSemana = d.getDay() === 0 || d.getDay() === 6
    const numReservas = (esFinDeSemana ? 3 : 2) + Math.floor(Math.random() * 2)
    const slotsBarajados = [...SLOTS].sort(() => Math.random() - 0.5).slice(0, numReservas)
    for (const slot of slotsBarajados) {
      const pista = pistas[Math.floor(Math.random() * pistas.length)]
      const inicio = fecha(dia, slot.h, slot.m)
      if (!reservarSlot(pista.id, inicio)) continue
      reservasData.push({
        startTime: inicio,
        endTime: finSlot(inicio),
        totalPrice: precioSlot(inicio),
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

  // 6e. Reservas futuras (próximos 7 días)
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
        totalPrice: precioSlot(inicio),
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
    { dia: -4, h: 15, m: 0, motivo: "Choiva - pista exterior impracticable" },
    { dia: -9, h: 10, m: 30, motivo: "Imprevisto do xogador" },
  ]
  for (const c of cancelaciones) {
    const pista = pistas[pistas.length - 1]
    const inicio = fecha(c.dia, c.h, c.m)
    if (!reservarSlot(pista.id, inicio)) continue
    reservasData.push({
      startTime: inicio,
      endTime: finSlot(inicio),
      totalPrice: precioSlot(inicio),
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
  console.log(`✅ ${reservas.count} reservas creadas (pasadas, hoy, futuras, clases y canceladas)`)

  // --- 7. Partidas abiertas ---
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
      // Hoy: 3 apuntados, falta 1
      { openMatchId: partidaHoy.id, userId: socios[0].id },
      { openMatchId: partidaHoy.id, userId: socios[1].id },
      { openMatchId: partidaHoy.id, userId: socios[3].id },
      // Futura: 2 apuntados
      { openMatchId: partidaFutura.id, userId: socios[2].id },
      { openMatchId: partidaFutura.id, userId: socios[5].id },
    ],
    skipDuplicates: true,
  })
  console.log("✅ 2 partidas abiertas creadas (hoy: falta 1 jugador)")

  // --- 8. Noticias ---
  await prisma.news.createMany({
    data: [
      {
        title: "Xa podes reservar pista online",
        content:
          "Estreamos sistema de reservas online. A partir de agora podes reservar pista desde o móbil as 24 horas, ver a dispoñibilidade en tempo real e cancelar ata 24 horas antes sen custo.\n\nEntra na sección Reservar, elixe pista e hora, e listo. Sen chamadas nin mensaxes.",
        published: true,
        clubId: club.id,
      },
      {
        title: "Torneo de verán - inscricións abertas",
        content:
          "Abrimos as inscricións para o Torneo de Verán do club. Formato por parellas, todas as categorías benvidas.\n\nDatas: última fin de semana de agosto.\nPrezo: 10€ por parella (inclúe bólas e picoteo).\n\nApúntate en recepción ou fálanos por teléfono.",
        published: true,
        clubId: club.id,
      },
      {
        title: "Novo horario de verán",
        content:
          "Durante os meses de verán o club abre de 9:00 a 22:00 todos os días.\n\nAs horas con máis demanda son as de tarde (18:00 a 21:30), recomendámosvos reservar con antelación desde a app.",
        published: true,
        clubId: club.id,
      },
    ],
  })
  console.log("✅ 3 noticias publicadas")

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
  console.log(`✅ ${reservasPagadas.length} pagos registrados`)

  // --- Resumen ---
  const baseUrl = esLocal ? "http://localhost:3000" : "https://padelclubos.com"
  console.log("\n🎉 Club demo listo!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Club:          ${args.name}`)
  console.log(`Portal:        ${baseUrl}/club/${args.slug}`)
  console.log(`Dashboard:     ${baseUrl}/login`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Admin:         ${adminEmail}`)
  console.log(`  Password:    ${args.adminPassword}`)
  console.log(`Socio ejemplo: ${sociosData[0].email}@${dominioEmail} (${sociosData[0].name})`)
  console.log(`  Password:    ${args.playerPassword}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("⚠️  Guarda estas credenciales: las passwords no se pueden recuperar del hash.")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed de club demo:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
