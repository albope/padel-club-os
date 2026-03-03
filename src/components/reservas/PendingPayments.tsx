'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { useLocale } from 'next-intl'
import { CreditCard, Check, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Loader2, Users, Undo2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/hooks/use-toast'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { BookingWithDetails } from './CalendarView'

interface PlayerPayment {
  id: string
  userId: string | null
  userName: string | null
  guestName: string | null
  amount: number
  status: string
  paidAt: string | null
  collectedByName: string | null
}

interface PlayerPaymentsData {
  bookingId: string
  totalPrice: number
  numPlayers: number
  paymentStatus: string
  payments: PlayerPayment[]
}

interface PendingPaymentsProps {
  bookings: BookingWithDetails[]
}

const PendingPayments: React.FC<PendingPaymentsProps> = ({ bookings: initialBookings }) => {
  const locale = useLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'
  const [bookings, setBookings] = useState(initialBookings)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingPaymentId, setLoadingPaymentId] = useState<string | null>(null)
  const [expandedBookingId, setExpandedBookingId] = useState<string | null>(null)
  const [playerPayments, setPlayerPayments] = useState<Record<string, PlayerPaymentsData>>({})
  const [loadingExpand, setLoadingExpand] = useState<string | null>(null)
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editingGuestName, setEditingGuestName] = useState('')
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean; bookingId: string; displayName: string; type: 'single' | 'all'
    paymentId?: string
  }>({ open: false, bookingId: '', displayName: '', type: 'all' })
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

  // Expandir/colapsar desglose de pagos
  const toggleExpand = useCallback(async (bookingId: string) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null)
      return
    }

    setExpandedBookingId(bookingId)

    if (!playerPayments[bookingId]) {
      setLoadingExpand(bookingId)
      try {
        const res = await fetch(`/api/bookings/${bookingId}/player-payments`)
        if (!res.ok) throw new Error(await res.text())
        const data: PlayerPaymentsData = await res.json()
        setPlayerPayments(prev => ({ ...prev, [bookingId]: data }))
      } catch {
        toast({ title: 'Error', description: 'No se pudo cargar el desglose de pagos.', variant: 'destructive' })
      } finally {
        setLoadingExpand(null)
      }
    }
  }, [expandedBookingId, playerPayments])

  // Cobrar un jugador individual
  const cobrarJugador = async (bookingId: string, paymentId: string, status: 'paid' | 'pending') => {
    setConfirmDialog(prev => ({ ...prev, open: false }))
    setLoadingPaymentId(paymentId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/player-payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updatedPayment: PlayerPayment = await res.json()

      setPlayerPayments(prev => {
        const data = prev[bookingId]
        if (!data) return prev
        const updatedPayments = data.payments.map(p =>
          p.id === paymentId ? updatedPayment : p
        )
        const todosPagados = updatedPayments.every(p => p.status === 'paid')
        return {
          ...prev,
          [bookingId]: { ...data, payments: updatedPayments, paymentStatus: todosPagados ? 'paid' : 'pending' },
        }
      })

      // Si todos pagados, actualizar el booking principal
      const datosActualizados = playerPayments[bookingId]
      if (datosActualizados) {
        const pagosActualizados = datosActualizados.payments.map(p =>
          p.id === paymentId ? updatedPayment : p
        )
        const todosPagados = pagosActualizados.every(p => p.status === 'paid')
        if (todosPagados) {
          setBookings(prev => prev.map(b =>
            b.id === bookingId ? { ...b, paymentStatus: 'paid' } : b
          ))
        }
      }

      toast({
        title: status === 'paid' ? 'Pago registrado' : 'Pago revertido',
        description: status === 'paid'
          ? `Cobro registrado para ${updatedPayment.userName || updatedPayment.guestName}.`
          : `Pago de ${updatedPayment.userName || updatedPayment.guestName} marcado como pendiente.`,
        variant: 'success',
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoadingPaymentId(null)
    }
  }

  // Cobrar todos los jugadores de una reserva
  const cobrarTodos = async (bookingId: string) => {
    setConfirmDialog(prev => ({ ...prev, open: false }))
    setLoadingId(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/payment`, { method: 'PATCH' })
      if (!res.ok) throw new Error(await res.text())

      setBookings(prev => prev.map(b =>
        b.id === bookingId ? { ...b, paymentStatus: 'paid' } : b
      ))

      setPlayerPayments(prev => {
        const data = prev[bookingId]
        if (!data) return prev
        return {
          ...prev,
          [bookingId]: {
            ...data,
            paymentStatus: 'paid',
            payments: data.payments.map(p => ({ ...p, status: 'paid', paidAt: new Date().toISOString() })),
          },
        }
      })

      toast({ title: 'Pago registrado', description: 'Todos los jugadores marcados como pagados.', variant: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoadingId(null)
    }
  }

  // Cambiar numero de jugadores
  const cambiarNumPlayers = async (bookingId: string, numPlayers: number) => {
    setLoadingExpand(bookingId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/player-payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ numPlayers }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: PlayerPaymentsData = await res.json()
      setPlayerPayments(prev => ({ ...prev, [bookingId]: data }))
      toast({ title: 'Desglose actualizado', description: `Dividido entre ${numPlayers} jugadores.`, variant: 'success' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setLoadingExpand(null)
    }
  }

  // Guardar nombre de invitado editado
  const guardarNombreInvitado = async (bookingId: string, paymentId: string) => {
    if (!editingGuestName.trim()) return
    setLoadingPaymentId(paymentId)
    try {
      const res = await fetch(`/api/bookings/${bookingId}/player-payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guestName: editingGuestName.trim() }),
      })
      if (!res.ok) throw new Error(await res.text())
      const updatedPayment: PlayerPayment = await res.json()

      setPlayerPayments(prev => {
        const data = prev[bookingId]
        if (!data) return prev
        return {
          ...prev,
          [bookingId]: {
            ...data,
            payments: data.payments.map(p => p.id === paymentId ? updatedPayment : p),
          },
        }
      })
      setEditingGuestId(null)
    } catch {
      toast({ title: 'Error', description: 'No se pudo actualizar el nombre.', variant: 'destructive' })
    } finally {
      setLoadingPaymentId(null)
    }
  }

  const handleConfirm = () => {
    if (confirmDialog.type === 'all') {
      cobrarTodos(confirmDialog.bookingId)
    } else if (confirmDialog.paymentId) {
      cobrarJugador(confirmDialog.bookingId, confirmDialog.paymentId, 'paid')
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
          <div className="space-y-1">
            {paginatedBookings.map(booking => {
              const displayName = booking.user?.name || booking.guestName || 'Invitado'
              const fecha = new Date(booking.startTime).toLocaleDateString(localeCode, {
                day: '2-digit', month: 'short',
              })
              const horaInicio = new Date(booking.startTime).toLocaleTimeString(localeCode, {
                hour: '2-digit', minute: '2-digit',
              })
              const horaFin = new Date(booking.endTime).toLocaleTimeString(localeCode, {
                hour: '2-digit', minute: '2-digit',
              })
              const isExpanded = expandedBookingId === booking.id
              const bookingPaymentsData = playerPayments[booking.id]
              const paidCount = bookingPaymentsData?.payments.filter(p => p.status === 'paid').length ?? 0
              const totalCount = bookingPaymentsData?.payments.length ?? 0

              return (
                <div key={booking.id} className="border rounded-lg">
                  {/* Fila principal de la reserva */}
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      onClick={() => toggleExpand(booking.id)}
                      className="shrink-0 p-1 rounded hover:bg-muted transition-colors"
                      aria-label={isExpanded ? 'Colapsar desglose' : 'Expandir desglose'}
                      aria-expanded={isExpanded}
                    >
                      {loadingExpand === booking.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{displayName}</span>
                        {bookingPaymentsData && totalCount > 0 && (
                          <Badge variant={paidCount === totalCount ? 'default' : 'secondary'} className="text-xs shrink-0">
                            {paidCount}/{totalCount} pagado
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {booking.court.name} &middot; {fecha} &middot; {horaInicio} - {horaFin}
                      </div>
                    </div>

                    <span className="font-semibold shrink-0">{booking.totalPrice.toFixed(2)}&euro;</span>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={loadingId === booking.id}
                      onClick={() => setConfirmDialog({
                        open: true,
                        bookingId: booking.id,
                        displayName,
                        type: 'all',
                      })}
                      aria-label={`Cobrar todo para reserva de ${displayName}`}
                    >
                      {loadingId === booking.id
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : <><Check className="h-4 w-4 mr-1" /> Cobrar todo</>
                      }
                    </Button>
                  </div>

                  {/* Desglose expandido por jugador */}
                  {isExpanded && (
                    <div className="border-t bg-muted/30 px-4 py-3">
                      {!bookingPaymentsData ? (
                        <div className="flex items-center justify-center py-4">
                          <Loader2 className="h-5 w-5 animate-spin mr-2" />
                          <span className="text-sm text-muted-foreground">Cargando desglose...</span>
                        </div>
                      ) : (
                        <>
                          {/* Selector de numero de jugadores */}
                          <div className="flex items-center gap-2 mb-3">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">Jugadores:</span>
                            <Select
                              value={String(bookingPaymentsData.numPlayers)}
                              onValueChange={(val) => cambiarNumPlayers(booking.id, Number(val))}
                            >
                              <SelectTrigger className="w-16 h-8" aria-label="Numero de jugadores">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="2">2</SelectItem>
                                <SelectItem value="3">3</SelectItem>
                                <SelectItem value="4">4</SelectItem>
                              </SelectContent>
                            </Select>
                            <span className="text-sm text-muted-foreground ml-2">
                              ({bookingPaymentsData.payments[0]?.amount.toFixed(2)}&euro; por jugador)
                            </span>
                          </div>

                          {/* Tabla de pagos por jugador */}
                          <div className="space-y-2">
                            {bookingPaymentsData.payments.map((payment) => {
                              const nombre = payment.userName || payment.guestName || 'Sin nombre'
                              const isPaid = payment.status === 'paid'
                              const isEditingGuest = editingGuestId === payment.id

                              return (
                                <div
                                  key={payment.id}
                                  className={`flex items-center gap-3 px-3 py-2 rounded-md ${isPaid ? 'bg-green-50 dark:bg-green-950/30' : 'bg-background'}`}
                                >
                                  <div className="flex-1 min-w-0">
                                    {isEditingGuest ? (
                                      <div className="flex items-center gap-1">
                                        <Input
                                          value={editingGuestName}
                                          onChange={(e) => setEditingGuestName(e.target.value)}
                                          className="h-7 text-sm"
                                          onKeyDown={(e) => {
                                            if (e.key === 'Enter') guardarNombreInvitado(booking.id, payment.id)
                                            if (e.key === 'Escape') setEditingGuestId(null)
                                          }}
                                          autoFocus
                                          aria-label="Nombre del jugador"
                                        />
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-7 px-2"
                                          onClick={() => guardarNombreInvitado(booking.id, payment.id)}
                                          aria-label="Guardar nombre"
                                        >
                                          <Check className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ) : (
                                      <button
                                        className={`text-sm truncate text-left ${!payment.userId ? 'text-muted-foreground hover:text-foreground cursor-pointer underline-offset-2 hover:underline' : ''}`}
                                        onClick={() => {
                                          if (!payment.userId) {
                                            setEditingGuestId(payment.id)
                                            setEditingGuestName(payment.guestName || '')
                                          }
                                        }}
                                        disabled={!!payment.userId}
                                        aria-label={!payment.userId ? `Editar nombre de ${nombre}` : undefined}
                                      >
                                        {nombre}
                                      </button>
                                    )}
                                  </div>

                                  <span className="text-sm font-medium shrink-0">
                                    {payment.amount.toFixed(2)}&euro;
                                  </span>

                                  <Badge
                                    variant={isPaid ? 'default' : 'secondary'}
                                    className={`text-xs shrink-0 ${isPaid ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                  >
                                    {isPaid ? 'Pagado' : 'Pendiente'}
                                  </Badge>

                                  {isPaid ? (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 px-2 text-muted-foreground"
                                      disabled={loadingPaymentId === payment.id}
                                      onClick={() => cobrarJugador(booking.id, payment.id, 'pending')}
                                      aria-label={`Revertir pago de ${nombre}`}
                                    >
                                      {loadingPaymentId === payment.id
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <Undo2 className="h-3 w-3" />
                                      }
                                    </Button>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="h-7 px-2"
                                      disabled={loadingPaymentId === payment.id}
                                      onClick={() => setConfirmDialog({
                                        open: true,
                                        bookingId: booking.id,
                                        displayName: nombre,
                                        type: 'single',
                                        paymentId: payment.id,
                                      })}
                                      aria-label={`Cobrar a ${nombre}`}
                                    >
                                      {loadingPaymentId === payment.id
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <><Check className="h-3 w-3 mr-1" /> Cobrar</>
                                      }
                                    </Button>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
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
              {confirmDialog.type === 'all'
                ? `Vas a marcar como pagados todos los jugadores de la reserva de ${confirmDialog.displayName}.`
                : `Vas a marcar como pagado a ${confirmDialog.displayName}.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmar Cobro
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default PendingPayments
