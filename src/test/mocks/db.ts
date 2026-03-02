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
  },
  court: {
    count: vi.fn(),
  },
  user: {
    count: vi.fn(),
    findMany: vi.fn(),
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
  },
  payment: {
    create: vi.fn(),
  },
}
