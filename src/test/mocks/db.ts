import { vi } from "vitest"

// Mock reutilizable del cliente Prisma para tests
export const mockDb = {
  passwordResetToken: {
    deleteMany: vi.fn(),
    create: vi.fn(),
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  courtPricing: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  club: {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
  },
  court: {
    count: vi.fn(),
    findFirst: vi.fn(),
  },
  user: {
    count: vi.fn(),
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
  notification: {
    create: vi.fn(),
  },
  pushSubscription: {
    findMany: vi.fn(),
    delete: vi.fn(),
  },
  booking: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  },
  payment: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  bookingPayment: {
    createMany: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  openMatch: {
    create: vi.fn(),
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  openMatchPlayer: {
    create: vi.fn(),
    createMany: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
    count: vi.fn(),
  },
  adminInvitation: {
    count: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  bookingWaitlist: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    upsert: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  },
  // Soporta ambos patrones:
  // Callback: db.$transaction(async (prisma) => {...})
  // Array: db.$transaction([op1, op2])
  $transaction: vi.fn().mockImplementation(async (input: unknown) => {
    if (typeof input === "function") {
      return input(mockDb)
    }
    // Array pattern: retorna el array tal cual (los mocks ya resolvieron)
    return Promise.all(input as Promise<unknown>[])
  }),
}
