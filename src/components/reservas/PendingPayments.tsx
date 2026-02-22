'use client'

import React, { useState, useMemo } from 'react'
import { CreditCard, Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { BookingWithDetails } from './CalendarView'

interface PendingPaymentsProps {
  bookings: BookingWithDetails[]
}

const PendingPayments: React.FC<PendingPaymentsProps> = ({ bookings: initialBookings }) => {
  const [bookings, setBookings] = useState(initialBookings)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; bookingId: string; displayName: string
  }>({ open: false, bookingId: '', displayName: '' })
  const [currentPage, setCurrentPage] = useState(1)
  const perPage = 10

  const pendingBookings = useMemo(() =>
    bookings.filter(b => b.paymentStatus === 'pending' && !b.cancelledAt),
    [bookings]
  )

  const totalPendiente = useMemo(() =>
    pendingBookings.reduce((sum, b) => sum + b.totalPrice, 0),
    [pendingBookings]
  )

  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * perPage
    return pendingBookings.slice(start, start + perPage)
  }, [pendingBookings, currentPage])

  const totalPages = Math.ceil(pendingBookings.length / perPage)

  const marcarComoPagado = async (bookingId: string) => {
    setConfirmDialog({ ...confirmDialog, open: false })
    setLoadingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment`, { method: 'PATCH' })
      if (!res.ok) throw new Error(await res.text())
      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, paymentStatus: 'paid' } : b
      ))
      toast({ title: 'Pago registrado', description: 'La reserva ha sido marcada como pagada.', variant: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoadingId(null)
    }
  }

  if (pendingBookings.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-lg font-medium">Todos los pagos al dia</p>
          <p className="text-sm text-muted-foreground mt-1">No hay cobros pendientes.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Pagos Pendientes
          </CardTitle>
          <Badge variant="secondary" className="text-sm">
            {pendingBookings.length} pendiente{pendingBookings.length !== 1 ? 's' : ''} &middot; {totalPendiente.toFixed(2)}&euro;
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 font-medium">Jugador</th>
                  <th className="pb-3 font-medium">Pista</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Hora</th>
                  <th className="pb-3 font-medium text-right">Precio</th>
                  <th className="pb-3 font-medium text-right">Accion</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map(booking => {
                  const displayName = booking.user?.name || booking.guestName || 'Invitado'
                  const fecha = new Date(booking.startTime).toLocaleDateString('es-ES', {
                    day: '2-digit', month: 'short',
                  })
                  const horaInicio = new Date(booking.startTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit', minute: '2-digit',
                  })
                  const horaFin = new Date(booking.endTime).toLocaleTimeString('es-ES', {
                    hour: '2-digit', minute: '2-digit',
                  })
                  return (
                    <tr key={booking.id} className="border-b last:border-b-0">
                      <td className="py-3 font-medium">{displayName}</td>
                      <td className="py-3">{booking.court.name}</td>
                      <td className="py-3">{fecha}</td>
                      <td className="py-3">{horaInicio} - {horaFin}</td>
                      <td className="py-3 text-right font-semibold">{booking.totalPrice.toFixed(2)}&euro;</td>
                      <td className="py-3 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={loadingId === booking.id}
                          onClick={() => setConfirmDialog({
                            open: true,
                            bookingId: booking.id,
                            displayName,
                          })}
                        >
                          {loadingId === booking.id
                            ? <Loader2 className="h-4 w-4 animate-spin" />
                            : <><Check className="h-4 w-4 mr-1" /> Cobrar</>
                          }
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-6 py-3">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
              <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
            </Button>
            <span className="text-sm text-muted-foreground">Pagina {currentPage} de {totalPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar cobro</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a marcar como pagada la reserva de {confirmDialog.displayName}. Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => marcarComoPagado(confirmDialog.bookingId)}>
              Confirmar Cobro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default PendingPayments
