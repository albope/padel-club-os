import { render, screen } from "@testing-library/react"
import { NextIntlClientProvider } from "next-intl"
import { describe, expect, it, vi } from "vitest"
import BookingModal from "@/components/reservas/BookingModal"
import type { BookingWithDetails } from "@/components/reservas/CalendarView"
import messages from "../../../messages/es.json"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}))

describe("BookingModal", () => {
  it("abre la creación en un panel lateral de 392 píxeles", () => {
    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <BookingModal
          isOpen
          onClose={vi.fn()}
          selectedInfo={new Date(2026, 7, 17, 9, 0)}
          preselectedCourtId="pista-1"
          courts={[]}
          users={[]}
        />
      </NextIntlClientProvider>,
    )

    expect(screen.getByRole("dialog", { name: "Nueva Reserva" })).toHaveClass(
      "inset-y-0",
      "right-0",
      "sm:max-w-[392px]",
    )
  })

  it("mantiene la edición en el diálogo centrado", () => {
    const reserva = {
      id: "reserva-1",
      startTime: new Date(2026, 7, 17, 9, 0),
      endTime: new Date(2026, 7, 17, 10, 30),
      totalPrice: 24,
      courtId: "pista-1",
      userId: "socio-1",
      guestName: null,
      clubId: "club-1",
      status: "confirmed",
      paymentStatus: "pending",
      paymentMethod: "presential",
      cancelledAt: null,
      cancelReason: null,
      reminderSentAt: null,
      numPlayers: 4,
      createdAt: new Date(2026, 7, 1),
      checkoutSessionId: null,
      checkoutSessionExpiresAt: null,
      checkoutLockUntil: null,
      recurringBookingId: null,
      user: { name: "Ana García" },
      court: { name: "Pista Central" },
      openMatch: null,
    } satisfies BookingWithDetails

    render(
      <NextIntlClientProvider locale="es" messages={messages}>
        <BookingModal
          isOpen
          onClose={vi.fn()}
          selectedInfo={reserva}
          courts={[]}
          users={[]}
        />
      </NextIntlClientProvider>,
    )

    const dialogo = screen.getByRole("dialog", { name: "Editar Reserva" })
    expect(dialogo).toHaveClass("sm:max-w-lg")
    expect(dialogo).not.toHaveClass("inset-y-0", "right-0")
  })
})
