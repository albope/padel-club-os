import { beforeEach, describe, expect, it, vi } from "vitest"
import { mockDb } from "@/test/mocks/db"
import { crearParams, crearRequest } from "@/test/helpers/api-route"

const mockGetServerSession = vi.fn()

vi.mock("@/lib/db", () => ({ db: mockDb }))
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

import { GET } from "@/app/api/club/[slug]/rankings/route"

describe("Privacidad del ranking del club", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDb.club.findUnique.mockResolvedValue({ id: "club-1" })
    mockDb.playerStats.findMany.mockResolvedValue([])
  })

  it("rechaza a visitantes sin sesión", async () => {
    mockGetServerSession.mockResolvedValue(null)

    const response = await GET(
      crearRequest({ method: "GET", url: "http://localhost/api/club/demo/rankings" }),
      crearParams({ slug: "demo" }),
    )

    expect(response.status).toBe(401)
    expect(mockDb.club.findUnique).not.toHaveBeenCalled()
    expect(mockDb.playerStats.findMany).not.toHaveBeenCalled()
  })

  it("rechaza a admins aunque pertenezcan al club", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "admin-1", role: "CLUB_ADMIN", clubId: "club-1" },
    })

    const response = await GET(
      crearRequest({ method: "GET", url: "http://localhost/api/club/demo/rankings" }),
      crearParams({ slug: "demo" }),
    )

    expect(response.status).toBe(403)
    expect(mockDb.playerStats.findMany).not.toHaveBeenCalled()
  })

  it("rechaza a jugadores de otro club", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "player-2", role: "PLAYER", clubId: "club-2" },
    })

    const response = await GET(
      crearRequest({ method: "GET", url: "http://localhost/api/club/demo/rankings" }),
      crearParams({ slug: "demo" }),
    )

    expect(response.status).toBe(403)
    expect(mockDb.playerStats.findMany).not.toHaveBeenCalled()
  })

  it("permite al jugador del club sin crear caché compartida", async () => {
    mockGetServerSession.mockResolvedValue({
      user: { id: "player-1", role: "PLAYER", clubId: "club-1" },
    })

    const response = await GET(
      crearRequest({ method: "GET", url: "http://localhost/api/club/demo/rankings" }),
      crearParams({ slug: "demo" }),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get("cache-control")).toBe("private, no-store")
    expect(mockDb.playerStats.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clubId: "club-1", matchesPlayed: { gt: 0 } },
      }),
    )
  })
})
