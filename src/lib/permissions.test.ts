import { describe, it, expect, vi } from "vitest"

// Mock de @prisma/client para el enum UserRole
vi.mock("@prisma/client", () => ({
  UserRole: {
    SUPER_ADMIN: "SUPER_ADMIN",
    CLUB_ADMIN: "CLUB_ADMIN",
    STAFF: "STAFF",
    PLAYER: "PLAYER",
  },
}))

import { hasPermission, hasAnyPermission, ADMIN_ROLES, PLAYER_ROLES } from "./permissions"
import type { Permission } from "./permissions"

describe("hasPermission", () => {
  describe("SUPER_ADMIN", () => {
    it("tiene todos los permisos de reservas", () => {
      expect(hasPermission("SUPER_ADMIN", "bookings:read")).toBe(true)
      expect(hasPermission("SUPER_ADMIN", "bookings:create")).toBe(true)
      expect(hasPermission("SUPER_ADMIN", "bookings:create-any")).toBe(true)
      expect(hasPermission("SUPER_ADMIN", "bookings:delete")).toBe(true)
    })

    it("tiene permisos de facturacion y analiticas", () => {
      expect(hasPermission("SUPER_ADMIN", "billing:read")).toBe(true)
      expect(hasPermission("SUPER_ADMIN", "billing:update")).toBe(true)
      expect(hasPermission("SUPER_ADMIN", "analytics:read")).toBe(true)
    })

    it("tiene permisos de blog y noticias", () => {
      expect(hasPermission("SUPER_ADMIN", "blog:create")).toBe(true)
      expect(hasPermission("SUPER_ADMIN", "news:create")).toBe(true)
    })
  })

  describe("CLUB_ADMIN", () => {
    it("tiene los mismos permisos que SUPER_ADMIN", () => {
      expect(hasPermission("CLUB_ADMIN", "users:create")).toBe(true)
      expect(hasPermission("CLUB_ADMIN", "settings:update")).toBe(true)
      expect(hasPermission("CLUB_ADMIN", "billing:update")).toBe(true)
    })
  })

  describe("STAFF", () => {
    it("puede gestionar reservas y pistas", () => {
      expect(hasPermission("STAFF", "bookings:create")).toBe(true)
      expect(hasPermission("STAFF", "bookings:create-any")).toBe(true)
      expect(hasPermission("STAFF", "courts:create")).toBe(true)
    })

    it("puede ver socios pero NO crear/editar/eliminar", () => {
      expect(hasPermission("STAFF", "users:read")).toBe(true)
      expect(hasPermission("STAFF", "users:create")).toBe(false)
      expect(hasPermission("STAFF", "users:update")).toBe(false)
      expect(hasPermission("STAFF", "users:delete")).toBe(false)
    })

    it("NO tiene permisos de facturacion ni ajustes", () => {
      expect(hasPermission("STAFF", "billing:read")).toBe(false)
      expect(hasPermission("STAFF", "settings:update")).toBe(false)
    })

    it("puede leer noticias pero NO crear", () => {
      expect(hasPermission("STAFF", "news:read")).toBe(true)
      expect(hasPermission("STAFF", "news:create")).toBe(false)
    })
  })

  describe("PLAYER", () => {
    it("puede crear reservas propias", () => {
      expect(hasPermission("PLAYER", "bookings:read")).toBe(true)
      expect(hasPermission("PLAYER", "bookings:create")).toBe(true)
    })

    it("NO puede crear reservas para otros", () => {
      expect(hasPermission("PLAYER", "bookings:create-any")).toBe(false)
    })

    it("puede unirse a partidas abiertas", () => {
      expect(hasPermission("PLAYER", "open-matches:read")).toBe(true)
      expect(hasPermission("PLAYER", "open-matches:join")).toBe(true)
      expect(hasPermission("PLAYER", "open-matches:create")).toBe(true)
    })

    it("NO puede eliminar partidas", () => {
      expect(hasPermission("PLAYER", "open-matches:delete")).toBe(false)
    })

    it("puede gestionar su perfil", () => {
      expect(hasPermission("PLAYER", "profile:read")).toBe(true)
      expect(hasPermission("PLAYER", "profile:update")).toBe(true)
      expect(hasPermission("PLAYER", "profile:export")).toBe(true)
      expect(hasPermission("PLAYER", "profile:delete")).toBe(true)
    })

    it("NO tiene permisos administrativos", () => {
      expect(hasPermission("PLAYER", "users:create")).toBe(false)
      expect(hasPermission("PLAYER", "courts:create")).toBe(false)
      expect(hasPermission("PLAYER", "settings:update")).toBe(false)
      expect(hasPermission("PLAYER", "billing:read")).toBe(false)
      expect(hasPermission("PLAYER", "analytics:read")).toBe(false)
    })
  })

  describe("audit:read", () => {
    it("concedido a SUPER_ADMIN y CLUB_ADMIN", () => {
      expect(hasPermission("SUPER_ADMIN", "audit:read")).toBe(true)
      expect(hasPermission("CLUB_ADMIN", "audit:read")).toBe(true)
    })

    it("denegado a STAFF y PLAYER", () => {
      expect(hasPermission("STAFF", "audit:read")).toBe(false)
      expect(hasPermission("PLAYER", "audit:read")).toBe(false)
    })
  })
})

describe("hasAnyPermission", () => {
  it("retorna true si el rol tiene al menos uno de los permisos", () => {
    expect(
      hasAnyPermission("PLAYER", ["users:create", "bookings:read"])
    ).toBe(true)
  })

  it("retorna false si el rol no tiene ninguno de los permisos", () => {
    expect(
      hasAnyPermission("PLAYER", ["users:create", "billing:read", "analytics:read"])
    ).toBe(false)
  })
})

describe("constantes de roles", () => {
  it("ADMIN_ROLES contiene SUPER_ADMIN, CLUB_ADMIN y STAFF", () => {
    expect(ADMIN_ROLES).toContain("SUPER_ADMIN")
    expect(ADMIN_ROLES).toContain("CLUB_ADMIN")
    expect(ADMIN_ROLES).toContain("STAFF")
    expect(ADMIN_ROLES).not.toContain("PLAYER")
  })

  it("PLAYER_ROLES contiene solo PLAYER", () => {
    expect(PLAYER_ROLES).toEqual(["PLAYER"])
  })
})
