import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import { pingHeartbeat } from "./heartbeat"

describe("pingHeartbeat", () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal("fetch", mockFetch)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("no hace nada si la URL es undefined", async () => {
    await expect(pingHeartbeat(undefined)).resolves.toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("no hace nada si la URL es cadena vacia", async () => {
    await expect(pingHeartbeat("")).resolves.toBeUndefined()
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it("llama a fetch con la URL cuando esta definida", async () => {
    mockFetch.mockResolvedValue(new Response("OK"))

    await pingHeartbeat("https://hc-ping.com/uuid-de-prueba")

    expect(mockFetch).toHaveBeenCalledTimes(1)
    expect(mockFetch).toHaveBeenCalledWith(
      "https://hc-ping.com/uuid-de-prueba",
      expect.objectContaining({ signal: expect.any(AbortSignal) })
    )
  })

  it("no lanza si fetch rechaza (fallo de red)", async () => {
    mockFetch.mockRejectedValue(new Error("network down"))

    await expect(pingHeartbeat("https://hc-ping.com/uuid-de-prueba")).resolves.toBeUndefined()
  })

  it("no lanza si fetch lanza de forma sincrona (URL invalida)", async () => {
    mockFetch.mockImplementation(() => {
      throw new TypeError("Invalid URL")
    })

    await expect(pingHeartbeat("no-es-una-url")).resolves.toBeUndefined()
  })
})
