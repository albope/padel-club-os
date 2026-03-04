/**
 * Factories de datos de test para integracion.
 * Cada builder retorna un objeto completo con overrides opcionales.
 */

// --- Helpers de fecha ---

/** Retorna un Date para manana a la hora:minuto indicada (UTC) */
export function manana(hora: number, minuto = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(hora, minuto, 0, 0)
  return d
}

/** Retorna un Date para pasado manana a la hora:minuto indicada (UTC) */
export function pasado(hora: number, minuto = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() + 2)
  d.setHours(hora, minuto, 0, 0)
  return d
}

/** Retorna un Date para ayer a la hora:minuto indicada (UTC) */
export function ayer(hora: number, minuto = 0): Date {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  d.setHours(hora, minuto, 0, 0)
  return d
}

// --- Builders ---

export function crearClubMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "club-1",
    name: "Club Test",
    slug: "club-test",
    enablePlayerBooking: true,
    enableOpenMatches: true,
    maxAdvanceBooking: 7,
    cancellationHours: 2,
    bookingPaymentMode: "presential",
    bookingDuration: 90,
    stripeConnectAccountId: null,
    stripeConnectOnboarded: false,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    subscriptionStatus: "active",
    subscriptionTier: "pro",
    primaryColor: "#2563eb",
    ...overrides,
  }
}

export function crearUsuarioMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "user-1",
    clubId: "club-1",
    role: "PLAYER",
    email: "jugador@test.com",
    name: "Jugador Test",
    isActive: true,
    ...overrides,
  }
}

export function crearPistaMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "court-1",
    name: "Pista 1",
    type: "indoor",
    clubId: "club-1",
    ...overrides,
  }
}

export function crearReservaMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    courtId: "court-1",
    userId: "user-1",
    clubId: "club-1",
    status: "confirmed",
    paymentStatus: "exempt",
    paymentMethod: "exempt",
    totalPrice: 20,
    numPlayers: 4,
    startTime: manana(10, 0),
    endTime: manana(11, 30),
    cancelledAt: null,
    cancelReason: null,
    reminderSentAt: null,
    recurringBookingId: null,
    checkoutSessionId: null,
    checkoutSessionExpiresAt: null,
    checkoutLockUntil: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    court: { name: "Pista 1" },
    club: { slug: "club-test", name: "Club Test" },
    user: { email: "jugador@test.com", name: "Jugador Test", club: { name: "Club Test", slug: "club-test" } },
    payment: null,
    ...overrides,
  }
}

export function crearPartidaMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "match-1",
    clubId: "club-1",
    courtId: "court-1",
    matchTime: manana(10, 0),
    status: "OPEN",
    bookingId: "booking-prov-1",
    levelMin: null,
    levelMax: null,
    booking: {
      id: "booking-prov-1",
      courtId: "court-1",
      startTime: manana(10, 0),
      endTime: manana(11, 30),
    },
    ...overrides,
  }
}

export function crearPagoMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "pay-1",
    bookingId: "booking-1",
    userId: "user-1",
    clubId: "club-1",
    stripePaymentId: "pi_test_123",
    status: "succeeded",
    amount: 20,
    currency: "EUR",
    type: "booking",
    createdAt: new Date(),
    ...overrides,
  }
}

export function crearEntradaWaitlistMock(overrides: Record<string, unknown> = {}) {
  return {
    id: "wl-1",
    courtId: "court-1",
    userId: "user-2",
    clubId: "club-1",
    startTime: manana(10, 0),
    endTime: manana(11, 30),
    status: "active",
    notifiedAt: null,
    createdAt: new Date(),
    court: { name: "Pista 1" },
    ...overrides,
  }
}

// --- Helper de sesion para mocks de requireAuth ---

export function crearSesionMock(overrides: Record<string, unknown> = {}) {
  return {
    session: {
      user: {
        id: "user-1",
        clubId: "club-1",
        role: "PLAYER",
        clubName: "Club Test",
        email: "jugador@test.com",
        name: "Jugador Test",
        ...overrides,
      },
    },
  }
}

export function crearSesionAdminMock(overrides: Record<string, unknown> = {}) {
  return crearSesionMock({ role: "CLUB_ADMIN", ...overrides })
}
