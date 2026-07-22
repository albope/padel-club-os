import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"
import PricingPlans from "@/components/facturacion/PricingPlans"

afterEach(() => {
  vi.unstubAllGlobals()
})

function botonDelPlan(nombre: string) {
  const heading = screen.getByRole("heading", { name: nombre })
  const card = heading.closest<HTMLElement>(".rounded-lg")
  if (!card) throw new Error(`No se encontro la tarjeta del plan ${nombre}`)
  return within(card).getByRole("button")
}

describe("PricingPlans", () => {
  it("permite recontratar el mismo plan tras cancelar", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: "Error de prueba" }),
    })
    vi.stubGlobal("fetch", fetchMock)
    render(<PricingPlans currentTier="pro" subscriptionStatus="canceled" />)

    const boton = botonDelPlan("Pro")
    expect(boton).toBeEnabled()
    expect(boton).toHaveTextContent("Elegir plan")

    await userEvent.click(boton)
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/stripe/checkout",
      expect.objectContaining({ body: JSON.stringify({ planKey: "pro" }) })
    )
  })

  it("mantiene deshabilitado el plan de una suscripcion activa", () => {
    render(<PricingPlans currentTier="pro" subscriptionStatus="active" />)

    expect(botonDelPlan("Pro")).toBeDisabled()
    expect(botonDelPlan("Pro")).toHaveTextContent("Plan actual")
  })
})
