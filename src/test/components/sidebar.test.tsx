import { render, screen, within } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"
import Sidebar from "@/components/layout/Sidebar"
import messages from "../../../messages/es.json"

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}))

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "CLUB_ADMIN" } } }),
}))

describe("Sidebar", () => {
  it("usa un rail accesible en ancho intermedio y recupera el panel completo en escritorio", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <Sidebar />
      </NextIntlClientProvider>,
    )

    const navegacion = screen.getByRole("navigation", { name: "Navegación principal" })
    const lateral = navegacion.closest("aside")
    expect(lateral).toHaveClass("w-[72px]", "xl:w-[264px]")

    const inicio = within(navegacion).getByRole("link", { name: "Dashboard" })
    expect(inicio).toHaveAttribute("title", "Dashboard")
    expect(inicio).toHaveClass("justify-center", "xl:justify-start")
    expect(within(inicio).getByText("Dashboard")).toHaveClass("hidden", "xl:inline")
    expect(screen.getByText("PadelClub OS")).toHaveClass("hidden", "xl:inline")
  })
})
