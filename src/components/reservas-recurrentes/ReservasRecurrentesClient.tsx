'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { Repeat, Pencil, Trash2, Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import EmptyState from '@/components/onboarding/EmptyState'

const DIAS_SEMANA = ["Domingo", "Lunes", "Martes", "Miercoles", "Jueves", "Viernes", "Sabado"]

interface RecurringBookingItem {
  id: string
  description: string | null
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  isActive: boolean
  startsAt: string
  endsAt: string
  courtId: string
  court: { name: string }
  userId: string | null
  user: { id: string; name: string | null; email: string | null } | null
  guestName: string | null
  createdAt: string
}

interface ReservasRecurrentesClientProps {
  initialItems: RecurringBookingItem[]
}

type FilterType = 'all' | 'active' | 'inactive'

function formatHora(hora: number, minuto: number): string {
  return `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`
}

function formatFecha(fecha: string, localeCode: string): string {
  return new Date(fecha).toLocaleDateString(localeCode, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ReservasRecurrentesClient({ initialItems }: ReservasRecurrentesClientProps) {
  const locale = useLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<FilterType>('all')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => Promise<void>
  }>({ open: false, title: '', description: '', action: async () => {} })

  const filteredItems = useMemo(() => {
    switch (filter) {
      case 'active': return items.filter((i) => i.isActive)
      case 'inactive': return items.filter((i) => !i.isActive)
      default: return items
    }
  }, [items, filter])

  const activeCount = items.filter((i) => i.isActive).length
  const inactiveCount = items.filter((i) => !i.isActive).length

  const handleToggleActive = async (item: RecurringBookingItem) => {
    setLoadingId(item.id)
    try {
      const response = await fetch(`/api/recurring-bookings/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Error al actualizar.')
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isActive: !i.isActive } : i))
      )

      toast({
        title: item.isActive ? "Reserva recurrente desactivada" : "Reserva recurrente activada",
        description: item.isActive
          ? "No se generaran mas reservas automaticas."
          : "Se reanuda la generacion de reservas.",
        variant: "success",
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: "Error", description: message, variant: "destructive" })
    } finally {
      setLoadingId(null)
    }
  }

  const handleDelete = (item: RecurringBookingItem) => {
    const label = item.description || `${DIAS_SEMANA[item.dayOfWeek]} ${formatHora(item.startHour, item.startMinute)}`
    setConfirmDialog({
      open: true,
      title: 'Eliminar reserva recurrente',
      description: `¿Seguro que quieres eliminar "${label}"? Las reservas ya generadas se mantendran.`,
      action: async () => {
        setLoadingId(item.id)
        try {
          const response = await fetch(`/api/recurring-bookings/${item.id}`, { method: 'DELETE' })
          if (!response.ok && response.status !== 204) {
            throw new Error('Error al eliminar.')
          }
          setItems((prev) => prev.filter((i) => i.id !== item.id))
          toast({
            title: "Reserva recurrente eliminada",
            description: "Las reservas ya generadas se mantienen.",
            variant: "success",
          })
          router.refresh()
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Error desconocido'
          toast({ title: "Error", description: message, variant: "destructive" })
        } finally {
          setLoadingId(null)
        }
      },
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Repeat}
            title="Sin reservas recurrentes"
            description="Crea tu primera reserva recurrente para automatizar las clases fijas de tu club."
            actionLabel="Crear primera clase"
            actionHref="/dashboard/reservas-recurrentes/nueva"
          />
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="p-4 border-b">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">Todas ({items.length})</TabsTrigger>
              <TabsTrigger value="active">Activas ({activeCount})</TabsTrigger>
              <TabsTrigger value="inactive">Inactivas ({inactiveCount})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="p-6">
          <ul className="space-y-1">
            {filteredItems.map((item, index) => (
              <React.Fragment key={item.id}>
                {index > 0 && <Separator />}
                <li className="group flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                  <Link
                    href={`/dashboard/reservas-recurrentes/${item.id}`}
                    className="flex-grow min-w-0"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-muted rounded-lg shrink-0">
                        <Repeat className="h-6 w-6 text-blue-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground group-hover:text-primary truncate">
                          {item.description || `${DIAS_SEMANA[item.dayOfWeek]} ${formatHora(item.startHour, item.startMinute)}`}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {DIAS_SEMANA[item.dayOfWeek]} {formatHora(item.startHour, item.startMinute)} - {formatHora(item.endHour, item.endMinute)} | {item.court.name}
                        </p>
                        <div className="flex items-center gap-3 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {item.user?.name || item.guestName || 'Sin asignar'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatFecha(item.startsAt, localeCode)} - {formatFecha(item.endsAt, localeCode)}
                          </span>
                          <Badge variant={item.isActive ? 'default' : 'secondary'}>
                            {item.isActive ? 'Activa' : 'Inactiva'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 mt-3 sm:mt-0 shrink-0">
                    {loadingId === item.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.preventDefault()
                            handleToggleActive(item)
                          }}
                        >
                          {item.isActive ? 'Desactivar' : 'Activar'}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/reservas-recurrentes/${item.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.preventDefault()
                            handleDelete(item)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </li>
              </React.Fragment>
            ))}
          </ul>
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await confirmDialog.action()
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
