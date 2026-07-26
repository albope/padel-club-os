import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it } from "vitest"
import Pricing from "@/components/marketing/Pricing"
import messages from "../../../messages/es.json"

describe("Pricing de marketing", () => {
  it("publica solo la periodicidad mensual que soporta el checkout", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <Pricing />
      </NextIntlClientProvider>,
    )

    expect(screen.queryByRole("button", { name: "Anual" })).not.toBeInTheDocument()
    expect(screen.queryByText(/Facturado anualmente/i)).not.toBeInTheDocument()
    expect(screen.getAllByText((_, element) => (
      element?.tagName === "SPAN"
      && element.textContent?.includes("cancela cuando quieras") === true
    ))).toHaveLength(3)
    expect(screen.getByText("Reserva online y paga en el club")).toBeInTheDocument()
  })
})
