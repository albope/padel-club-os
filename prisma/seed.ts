// prisma/seed.ts - Script para poblar la base de datos con datos ficticios
// Ejecutar con: npx tsx prisma/seed.ts

import { PrismaClient, UserRole, CompetitionFormat, CompetitionStatus, OpenMatchStatus } from "@prisma/client"
import { hash } from "bcrypt"

const prisma = new PrismaClient()

async function main() {
  const CLUB_ID = "cmlw9zgbd0000sa8klu1w413y" // Club Padel Demo existente
  const ADMIN_ID = "cmlw9zgfd0002sa8k44brd549" // Alberto (admin existente)

  console.log("🌱 Iniciando seed de datos ficticios...")

  // ============================================
  // 1. ACTUALIZAR CLUB CON MAS DETALLES
  // ============================================
  await prisma.club.update({
    where: { id: CLUB_ID },
    data: {
      description: "El club de padel de referencia en Madrid. 6 pistas de ultima generacion, clases para todos los niveles y un ambiente inmejorable.",
      phone: "+34 912 345 678",
      email: "info@clubpadeldemo.es",
      address: "Calle de la Raqueta 42, 28001 Madrid",
      openingTime: "08:00",
      closingTime: "23:00",
      primaryColor: "#4f46e5",
      maxAdvanceBooking: 14,
      cancellationHours: 4,
      enableOpenMatches: true,
      enablePlayerBooking: true,
      bookingPaymentMode: "both",
    },
  })
  console.log("✅ Club actualizado con detalles")

  // ============================================
  // 2. CREAR PISTAS
  // ============================================
  const pistasData = [
    { name: "Pista 1 - Central", type: "Indoor" },
    { name: "Pista 2 - Cristal", type: "Indoor" },
    { name: "Pista 3 - Panoramica", type: "Indoor" },
    { name: "Pista 4 - Exterior", type: "Outdoor" },
    { name: "Pista 5 - Exterior", type: "Outdoor" },
    { name: "Pista 6 - Mini", type: "Indoor" },
  ]

  const pistas = []
  for (const pista of pistasData) {
    const court = await prisma.court.create({
      data: { ...pista, clubId: CLUB_ID },
    })
    pistas.push(court)
  }
  console.log(`✅ ${pistas.length} pistas creadas`)

  // ============================================
  // 3. CREAR PRECIOS POR PISTA
  // ============================================
  const preciosInserts = []
  for (const pista of pistas) {
    for (let dia = 0; dia <= 6; dia++) {
      const esFinDeSemana = dia === 0 || dia === 6
      for (let hora = 8; hora < 23; hora++) {
        let precio: number
        if (esFinDeSemana) {
          // Fin de semana: precio unico todo el dia
          precio = 6.50
        } else if (hora >= 17) {
          // L-V tarde/noche (17:00 - cierre)
          precio = 8.00
        } else {
          // L-V mañana/mediodia (8:00 - 17:00)
          precio = 5.00
        }
        preciosInserts.push({
          courtId: pista.id,
          dayOfWeek: dia,
          startHour: hora,
          endHour: hora + 1,
          price: precio,
          clubId: CLUB_ID,
        })
      }
    }
  }
  await prisma.courtPricing.createMany({ data: preciosInserts })
  console.log(`✅ ${preciosInserts.length} precios de pista creados`)

  // ============================================
  // 4. CREAR JUGADORES (SOCIOS)
  // ============================================
  const passwordHash = await hash("password123", 10)

  const jugadoresData = [
    { name: "Carlos Garcia", email: "carlos@demo.es", phone: "+34 611 111 111", level: "3.5", position: "Reves" },
    { name: "Maria Lopez", email: "maria@demo.es", phone: "+34 622 222 222", level: "4.0", position: "Drive" },
    { name: "Pablo Martinez", email: "pablo@demo.es", phone: "+34 633 333 333", level: "3.0", position: "Reves" },
    { name: "Laura Fernandez", email: "laura@demo.es", phone: "+34 644 444 444", level: "4.5", position: "Drive" },
    { name: "Javier Rodriguez", email: "javier@demo.es", phone: "+34 655 555 555", level: "3.5", position: "Reves" },
    { name: "Ana Sanchez", email: "ana@demo.es", phone: "+34 666 666 666", level: "3.0", position: "Drive" },
    { name: "David Perez", email: "david@demo.es", phone: "+34 677 777 777", level: "5.0", position: "Reves" },
    { name: "Sofia Ruiz", email: "sofia@demo.es", phone: "+34 688 888 888", level: "4.0", position: "Drive" },
    { name: "Marcos Torres", email: "marcos@demo.es", phone: "+34 699 999 999", level: "2.5", position: "Reves" },
    { name: "Elena Diaz", email: "elena@demo.es", phone: "+34 600 100 100", level: "3.5", position: "Drive" },
    { name: "Alejandro Moreno", email: "alejandro@demo.es", phone: "+34 600 200 200", level: "4.0", position: "Reves" },
    { name: "Lucia Gil", email: "lucia@demo.es", phone: "+34 600 300 300", level: "3.0", position: "Drive" },
    { name: "Raul Navarro", email: "raul@demo.es", phone: "+34 600 400 400", level: "4.5", position: "Reves" },
    { name: "Carmen Vega", email: "carmen@demo.es", phone: "+34 600 500 500", level: "3.5", position: "Drive" },
    { name: "Hugo Jimenez", email: "hugo@demo.es", phone: "+34 600 600 600", level: "2.0", position: "Reves" },
    { name: "Isabel Romero", email: "isabel@demo.es", phone: "+34 600 700 700", level: "3.5", position: "Drive" },
  ]

  // Crear un STAFF tambien
  const staff = await prisma.user.create({
    data: {
      name: "Pedro Entrenador",
      email: "pedro@demo.es",
      password: passwordHash,
      phone: "+34 600 000 001",
      role: UserRole.STAFF,
      clubId: CLUB_ID,
    },
  })

  const jugadores = []
  for (const j of jugadoresData) {
    const user = await prisma.user.create({
      data: {
        ...j,
        password: passwordHash,
        role: UserRole.PLAYER,
        clubId: CLUB_ID,
      },
    })
    jugadores.push(user)
  }
  console.log(`✅ 1 staff + ${jugadores.length} jugadores creados`)

  // ============================================
  // 5. CREAR RESERVAS (pasadas, hoy, futuras)
  // ============================================
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  function fecha(diasDesdeHoy: number, hora: number): Date {
    const d = new Date(hoy)
    d.setDate(d.getDate() + diasDesdeHoy)
    d.setHours(hora, 0, 0, 0)
    return d
  }

  // Set para rastrear reservas unicas (courtId + startTime)
  const reservaKeys = new Set<string>()

  const reservasData: Array<{
    startTime: Date
    endTime: Date
    totalPrice: number
    courtId: string
    userId: string
    clubId: string
    status: string
    paymentStatus: string
  }> = []

  // Reservas pasadas (ultimos 30 dias)
  for (let dia = -30; dia < 0; dia++) {
    const numReservas = Math.floor(Math.random() * 4) + 2 // 2-5 reservas por dia
    for (let r = 0; r < numReservas; r++) {
      const hora = 9 + Math.floor(Math.random() * 13) // 9-21
      const pistaIdx = Math.floor(Math.random() * pistas.length)
      const jugadorIdx = Math.floor(Math.random() * jugadores.length)
      const key = `${pistas[pistaIdx].id}-${fecha(dia, hora).toISOString()}`
      if (reservaKeys.has(key)) continue
      reservaKeys.add(key)

      reservasData.push({
        startTime: fecha(dia, hora),
        endTime: fecha(dia, hora + 1.5),
        totalPrice: 20 + Math.floor(Math.random() * 16),
        courtId: pistas[pistaIdx].id,
        userId: jugadorIdx % 3 === 0 ? ADMIN_ID : jugadores[jugadorIdx].id,
        clubId: CLUB_ID,
        status: "confirmed",
        paymentStatus: Math.random() > 0.3 ? "paid" : "exempt",
      })
    }
  }

  // Reservas de hoy
  const horasHoy = [9, 10, 11, 13, 16, 17, 18, 19, 20, 21]
  for (const hora of horasHoy) {
    const pistaIdx = Math.floor(Math.random() * pistas.length)
    const jugadorIdx = Math.floor(Math.random() * jugadores.length)
    const key = `${pistas[pistaIdx].id}-${fecha(0, hora).toISOString()}`
    if (reservaKeys.has(key)) continue
    reservaKeys.add(key)

    reservasData.push({
      startTime: fecha(0, hora),
      endTime: fecha(0, hora + 1.5),
      totalPrice: 24 + Math.floor(Math.random() * 12),
      courtId: pistas[pistaIdx].id,
      userId: jugadores[jugadorIdx].id,
      clubId: CLUB_ID,
      status: "confirmed",
      paymentStatus: "pending",
    })
  }

  // Reservas futuras (proximos 7 dias)
  for (let dia = 1; dia <= 7; dia++) {
    const numReservas = Math.floor(Math.random() * 5) + 1
    for (let r = 0; r < numReservas; r++) {
      const hora = 9 + Math.floor(Math.random() * 13)
      const pistaIdx = Math.floor(Math.random() * pistas.length)
      const jugadorIdx = Math.floor(Math.random() * jugadores.length)
      const key = `${pistas[pistaIdx].id}-${fecha(dia, hora).toISOString()}`
      if (reservaKeys.has(key)) continue
      reservaKeys.add(key)

      reservasData.push({
        startTime: fecha(dia, hora),
        endTime: fecha(dia, hora + 1.5),
        totalPrice: 20 + Math.floor(Math.random() * 16),
        courtId: pistas[pistaIdx].id,
        userId: jugadores[jugadorIdx].id,
        clubId: CLUB_ID,
        status: "confirmed",
        paymentStatus: "pending",
      })
    }
  }

  // Unas pocas reservas canceladas
  for (let i = 0; i < 5; i++) {
    const dia = -Math.floor(Math.random() * 20) - 1
    const hora = 10 + Math.floor(Math.random() * 10)
    const pistaIdx = Math.floor(Math.random() * pistas.length)
    const jugadorIdx = Math.floor(Math.random() * jugadores.length)
    const key = `${pistas[pistaIdx].id}-${fecha(dia, hora).toISOString()}`
    if (reservaKeys.has(key)) continue
    reservaKeys.add(key)

    const cancelDate = new Date(fecha(dia, hora))
    cancelDate.setDate(cancelDate.getDate() - 1)

    reservasData.push({
      startTime: fecha(dia, hora),
      endTime: fecha(dia, hora + 1.5),
      totalPrice: 22,
      courtId: pistas[pistaIdx].id,
      userId: jugadores[jugadorIdx].id,
      clubId: CLUB_ID,
      status: "cancelled",
      paymentStatus: "exempt",
    })
  }

  const reservas = await prisma.booking.createMany({ data: reservasData })
  console.log(`✅ ${reservas.count} reservas creadas`)

  // ============================================
  // 6. CREAR PARTIDAS ABIERTAS
  // ============================================

  // Partidas abiertas futuras
  const partidasData = []
  for (let dia = 0; dia <= 5; dia++) {
    const numPartidas = dia === 0 ? 3 : Math.floor(Math.random() * 2) + 1
    for (let p = 0; p < numPartidas; p++) {
      const hora = 10 + Math.floor(Math.random() * 11) // 10-20
      const pistaIdx = Math.floor(Math.random() * pistas.length)
      const nivel = [2.0, 2.5, 3.0, 3.5, 4.0, 4.5]
      const nivelBase = nivel[Math.floor(Math.random() * nivel.length)]

      partidasData.push({
        matchTime: fecha(dia, hora),
        status: dia === 0 && p === 0 ? OpenMatchStatus.FULL : OpenMatchStatus.OPEN,
        levelMin: nivelBase - 0.5,
        levelMax: nivelBase + 0.5,
        courtId: pistas[pistaIdx].id,
        clubId: CLUB_ID,
      })
    }
  }

  // Unas partidas pasadas confirmadas
  for (let dia = -10; dia < 0; dia += 2) {
    const hora = 18 + Math.floor(Math.random() * 3)
    const pistaIdx = Math.floor(Math.random() * pistas.length)
    partidasData.push({
      matchTime: fecha(dia, hora),
      status: OpenMatchStatus.CONFIRMED,
      levelMin: 3.0,
      levelMax: 4.0,
      courtId: pistas[pistaIdx].id,
      clubId: CLUB_ID,
    })
  }

  const partidas = []
  for (const pd of partidasData) {
    const om = await prisma.openMatch.create({ data: pd })
    partidas.push(om)
  }
  console.log(`✅ ${partidas.length} partidas abiertas creadas`)

  // Asignar jugadores a las partidas
  for (let i = 0; i < partidas.length; i++) {
    const partida = partidas[i]
    const numJugadores = partida.status === "FULL" || partida.status === "CONFIRMED" ? 4 : Math.floor(Math.random() * 3) + 1

    const jugadoresUsados = new Set<string>()
    for (let j = 0; j < numJugadores; j++) {
      let jugadorIdx: number
      do {
        jugadorIdx = Math.floor(Math.random() * jugadores.length)
      } while (jugadoresUsados.has(jugadores[jugadorIdx].id))
      jugadoresUsados.add(jugadores[jugadorIdx].id)

      await prisma.openMatchPlayer.create({
        data: {
          openMatchId: partida.id,
          userId: jugadores[jugadorIdx].id,
        },
      })
    }
  }
  console.log("✅ Jugadores asignados a partidas abiertas")

  // ============================================
  // 7. CREAR COMPETICIONES
  // ============================================

  // Liga activa
  const liga = await prisma.competition.create({
    data: {
      name: "Liga Invierno 2026",
      clubId: CLUB_ID,
      format: CompetitionFormat.LEAGUE,
      rounds: 2,
      status: CompetitionStatus.ACTIVE,
    },
  })

  // Crear 6 equipos para la liga
  const equiposLiga = []
  for (let i = 0; i < 6; i++) {
    const p1 = jugadores[i * 2]
    const p2 = jugadores[i * 2 + 1]
    const equipo = await prisma.team.create({
      data: {
        name: `${p1.name!.split(" ")[0]} / ${p2.name!.split(" ")[0]}`,
        player1Id: p1.id,
        player2Id: p2.id,
        competitionId: liga.id,
        points: Math.floor(Math.random() * 15),
        played: 4 + Math.floor(Math.random() * 3),
        won: Math.floor(Math.random() * 5),
        lost: Math.floor(Math.random() * 4),
        setsFor: Math.floor(Math.random() * 10) + 4,
        setsAgainst: Math.floor(Math.random() * 8) + 2,
        gamesFor: Math.floor(Math.random() * 40) + 20,
        gamesAgainst: Math.floor(Math.random() * 35) + 15,
      },
    })
    equiposLiga.push(equipo)
  }

  // Crear partidos de liga
  const resultadosLiga = ["6-3 6-4", "7-5 4-6 6-3", "6-1 6-2", "6-4 3-6 7-5", "6-0 6-3", "7-6 6-4"]
  let ronda = 1
  for (let i = 0; i < equiposLiga.length; i++) {
    for (let j = i + 1; j < equiposLiga.length; j++) {
      const jugado = Math.random() > 0.3
      await prisma.match.create({
        data: {
          competitionId: liga.id,
          team1Id: equiposLiga[i].id,
          team2Id: equiposLiga[j].id,
          roundNumber: ronda,
          result: jugado ? resultadosLiga[Math.floor(Math.random() * resultadosLiga.length)] : null,
          matchDate: jugado ? fecha(-Math.floor(Math.random() * 20), 18) : fecha(Math.floor(Math.random() * 14) + 1, 19),
          winnerId: jugado ? (Math.random() > 0.5 ? equiposLiga[i].id : equiposLiga[j].id) : null,
        },
      })
      ronda = ronda >= 2 ? 1 : ronda + 1
    }
  }

  // Torneo eliminatorio terminado
  const torneo = await prisma.competition.create({
    data: {
      name: "Torneo Navidad 2025",
      clubId: CLUB_ID,
      format: CompetitionFormat.KNOCKOUT,
      rounds: 3,
      status: CompetitionStatus.FINISHED,
    },
  })

  // 8 equipos para el torneo
  const equiposTorneo = []
  for (let i = 0; i < 8; i++) {
    const p1Idx = i % jugadores.length
    const p2Idx = (i + 8) % jugadores.length
    const equipo = await prisma.team.create({
      data: {
        name: `${jugadores[p1Idx].name!.split(" ")[0]} / ${jugadores[p2Idx].name!.split(" ")[0]}`,
        player1Id: jugadores[p1Idx].id,
        player2Id: jugadores[p2Idx].id,
        competitionId: torneo.id,
      },
    })
    equiposTorneo.push(equipo)
  }

  // Cuartos de final
  for (let i = 0; i < 4; i++) {
    await prisma.match.create({
      data: {
        competitionId: torneo.id,
        team1Id: equiposTorneo[i * 2].id,
        team2Id: equiposTorneo[i * 2 + 1].id,
        roundNumber: 1,
        roundName: "Cuartos de final",
        result: resultadosLiga[i],
        matchDate: fecha(-30, 17 + i),
        winnerId: equiposTorneo[i * 2].id,
      },
    })
  }

  // Semifinales
  for (let i = 0; i < 2; i++) {
    await prisma.match.create({
      data: {
        competitionId: torneo.id,
        team1Id: equiposTorneo[i * 4].id,
        team2Id: equiposTorneo[(i + 1) * 4 > 7 ? 4 : (i + 1) * 4].id,
        roundNumber: 2,
        roundName: "Semifinal",
        result: resultadosLiga[i + 4],
        matchDate: fecha(-20, 18 + i),
        winnerId: equiposTorneo[i * 4].id,
      },
    })
  }

  // Final
  await prisma.match.create({
    data: {
      competitionId: torneo.id,
      team1Id: equiposTorneo[0].id,
      team2Id: equiposTorneo[4].id,
      roundNumber: 3,
      roundName: "Final",
      result: "7-6 4-6 6-3",
      matchDate: fecha(-14, 19),
      winnerId: equiposTorneo[0].id,
    },
  })

  console.log("✅ 2 competiciones creadas (liga activa + torneo finalizado)")

  // ============================================
  // 8. CREAR NOTICIAS
  // ============================================
  const noticiasData = [
    {
      title: "Inauguracion de la nueva Pista 6 Mini",
      content: "Nos complace anunciar la apertura de nuestra sexta pista, un formato mini ideal para clases y partidos de practica. La pista cuenta con iluminacion LED de ultima generacion y cesped artificial de alta calidad.\n\nHorario de uso: de 8:00 a 23:00.\n\nDurante la primera semana el precio sera un 50% mas barato. ¡No os lo perdais!",
      published: true,
    },
    {
      title: "Resultados de la Liga Invierno 2026 - Jornada 4",
      content: "Ya tenemos los resultados de la cuarta jornada de nuestra Liga de Invierno. Las clasificaciones estan muy apretadas con tres equipos empatados a puntos en cabeza.\n\nDestacamos la victoria de Carlos/Maria frente a los actuales lideres por un ajustado 7-6 4-6 6-3.\n\nLa proxima jornada se disputara el sabado 1 de marzo. ¡No falteis!",
      published: true,
    },
    {
      title: "Clinics de padel con David Perez",
      content: "Este fin de semana contaremos con clinics especiales impartidos por David Perez, jugador de nivel 5.0 y miembro de nuestro club.\n\nLos clinics tendran una duracion de 2 horas y se centraran en:\n- Tecnica de volea\n- Bandejas y vibroras\n- Tactica de juego en pareja\n\nPlazas limitadas a 8 personas por sesion. Inscripciones en recepcion.",
      published: true,
    },
    {
      title: "Horarios especiales Semana Santa",
      content: "Informamos que durante la Semana Santa (del 29 de marzo al 6 de abril) el club mantendra un horario especial:\n\n- Lunes a viernes: 9:00 - 22:00\n- Sabados y domingos: 8:00 - 23:00\n\nLa recepcion cerrara a las 21:00 de lunes a viernes.",
      published: true,
    },
    {
      title: "Nuevo sistema de reservas online",
      content: "Hemos actualizado nuestro sistema de reservas para que sea mas facil y rapido reservar pista desde el movil.\n\nAhora puedes:\n- Ver la disponibilidad en tiempo real\n- Reservar con hasta 14 dias de antelacion\n- Cancelar hasta 4 horas antes sin coste\n- Ver el precio exacto de cada franja horaria\n\n¡Pruebalo en la seccion Reservar del portal!",
      published: true,
    },
    {
      title: "Torneo de Primavera 2026 - Inscripciones abiertas",
      content: "¡Ya estan abiertas las inscripciones para el Torneo de Primavera 2026!\n\nFormato: Eliminatoria directa\nFecha: 15-16 de abril\nCategoria: Mixta (todos los niveles)\nPrecio: 15€ por pareja\n\nPremios:\n- 1er puesto: 200€ en material\n- 2do puesto: 100€ en material\n- 3er puesto: Clase gratuita con nuestro entrenador\n\nInscripciones hasta el 10 de abril.",
      published: false, // Borrador
    },
  ]

  for (const noticia of noticiasData) {
    await prisma.news.create({
      data: {
        ...noticia,
        clubId: CLUB_ID,
      },
    })
  }
  console.log(`✅ ${noticiasData.length} noticias creadas (5 publicadas + 1 borrador)`)

  // ============================================
  // 9. CREAR PAGOS (para reservas pasadas pagadas)
  // ============================================
  const reservasPagadas = await prisma.booking.findMany({
    where: {
      clubId: CLUB_ID,
      paymentStatus: "paid",
      status: "confirmed",
    },
    take: 30,
  })

  let pagosCreados = 0
  for (const reserva of reservasPagadas) {
    if (!reserva.userId) continue
    await prisma.payment.create({
      data: {
        amount: reserva.totalPrice,
        currency: "EUR",
        status: "succeeded",
        type: "booking",
        bookingId: reserva.id,
        userId: reserva.userId,
        clubId: CLUB_ID,
      },
    })
    pagosCreados++
  }
  console.log(`✅ ${pagosCreados} pagos creados`)

  // ============================================
  // 10. CREAR ESTADISTICAS DE JUGADOR
  // ============================================
  for (const jugador of jugadores) {
    const nivel = parseFloat(jugador.level || "3.0")
    const partidos = 10 + Math.floor(Math.random() * 40)
    const ganados = Math.floor(partidos * (0.3 + Math.random() * 0.4))

    await prisma.playerStats.create({
      data: {
        userId: jugador.id,
        clubId: CLUB_ID,
        eloRating: 1200 + nivel * 100 + Math.floor(Math.random() * 200),
        matchesPlayed: partidos,
        matchesWon: ganados,
        setsWon: ganados * 2 + Math.floor(Math.random() * 10),
        setsLost: (partidos - ganados) * 2 + Math.floor(Math.random() * 5),
        gamesWon: ganados * 12 + Math.floor(Math.random() * 30),
        gamesLost: (partidos - ganados) * 10 + Math.floor(Math.random() * 25),
        winStreak: Math.floor(Math.random() * 5),
        bestWinStreak: 2 + Math.floor(Math.random() * 8),
      },
    })
  }
  console.log(`✅ ${jugadores.length} estadisticas de jugador creadas`)

  // ============================================
  // RESUMEN
  // ============================================
  console.log("\n🎉 Seed completado!")
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`Club:          Club Padel Demo`)
  console.log(`Pistas:        ${pistas.length}`)
  console.log(`Precios:       ${preciosInserts.length}`)
  console.log(`Staff:         1 (pedro@demo.es)`)
  console.log(`Jugadores:     ${jugadores.length}`)
  console.log(`Reservas:      ${reservasData.length}`)
  console.log(`Partidas:      ${partidas.length}`)
  console.log(`Competiciones: 2`)
  console.log(`Noticias:      ${noticiasData.length}`)
  console.log(`Pagos:         ${pagosCreados}`)
  console.log(`Stats:         ${jugadores.length}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log("\n📌 Credenciales de prueba:")
  console.log("   Admin:   albertobort@gmail.com (tu cuenta)")
  console.log("   Staff:   pedro@demo.es / password123")
  console.log("   Players: carlos@demo.es / password123 (y 15 mas)")
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
