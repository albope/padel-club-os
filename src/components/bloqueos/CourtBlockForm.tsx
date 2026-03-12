'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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

const MOTIVOS = [
  { value: 'MAINTENANCE', label: 'Mantenimiento' },
  { value: 'HOLIDAY', label: 'Festivo' },
  { value: 'EVENT', label: 'Evento' },
  { value: 'OTHER', label: 'Otro' },
]

// Horas de 07:00 a 23:00 en intervalos de 30 min
const HORAS_DISPONIBLES = Array.from({ length: 33 }, (_, i) => {
  const hora = Math.floor(i / 2) + 7
  const minuto = i % 2 === 0 ? 0 : 30
  return {
    value: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
    label: `${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`,
  }
})

const FormSchema = z.object({
  courtId: z.string().optional(),
  reason: z.string().min(1, 'Selecciona un motivo.'),
  note: z.string().max(300).optional(),
  date: z.string().min(1, 'Selecciona una fecha.'),
  startTime: z.string().min(1, 'Selecciona hora de inicio.'),
  endTime: z.string().min(1, 'Selecciona hora de fin.'),
}).refine(
  (d) => d.startTime < d.endTime,
  { message: 'La hora de fin debe ser posterior a la de inicio.', path: ['endTime'] }
)

type FormValues = z.infer<typeof FormSchema>

interface Court {
  id: string
  name: string
}

interface CourtBlockData {
  id: string
  reason: string
  note: string | null
  startTime: string
  endTime: string
  courtId: string | null
}

interface ConflictItem {
  bookingId: string
  courtName: string
  startTime: string
  endTime: string
  userName: string | null
  guestName: string | null
  tipo: string
}

interface CourtBlockFormProps {
  courts: Court[]
  courtBlock?: CourtBlockData
}

export default function CourtBlockForm({ courts, courtBlock }: CourtBlockFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!courtBlock

  // Extraer fecha y horas del bloqueo existente
  const defaultDate = courtBlock
    ? new Date(courtBlock.startTime).toISOString().split('T')[0]
    : ''
  const defaultStartTime = courtBlock
    ? new Date(courtBlock.startTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''
  const defaultEndTime = courtBlock
    ? new Date(courtBlock.endTime).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : ''

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      courtId: courtBlock?.courtId || '',
      reason: courtBlock?.reason || '',
      note: courtBlock?.note || '',
      date: defaultDate,
      startTime: defaultStartTime,
      endTime: defaultEndTime,
    },
  })

  // Estado para dialog de conflictos
  const [conflicts, setConflicts] = useState<ConflictItem[]>([])
  const [conflictDialogOpen, setConflictDialogOpen] = useState(false)
  const [pendingPayload, setPendingPayload] = useState<Record<string, unknown> | null>(null)

  const buildPayload = (values: FormValues, cancelConflicting = false) => {
    const startTime = new Date(`${values.date}T${values.startTime}:00`).toISOString()
    const endTime = new Date(`${values.date}T${values.endTime}:00`).toISOString()

    return {
      courtId: values.courtId || null,
      reason: values.reason,
      note: values.note || undefined,
      startTime,
      endTime,
      cancelConflicting,
    }
  }

  const submitRequest = async (payload: Record<string, unknown>) => {
    const url = isEditing ? `/api/court-blocks/${courtBlock.id}` : '/api/court-blocks'
    const method = isEditing ? 'PATCH' : 'POST'

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (response.status === 409) {
      const data = await response.json()
      if (data.conflicts) {
        setConflicts(data.conflicts)
        setPendingPayload(payload)
        setConflictDialogOpen(true)
        return 'conflicts'
      }
      throw new Error(data.error || 'Conflicto de horario.')
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'Error al guardar el bloqueo.')
    }

    return 'success'
  }

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      const payload = buildPayload(values, false)
      const result = await submitRequest(payload)
      if (result === 'success') {
        toast({
          title: isEditing ? 'Bloqueo actualizado' : 'Bloqueo creado',
          description: isEditing
            ? 'Los cambios se han guardado correctamente.'
            : 'El bloqueo ha sido creado. Las reservas en ese horario seran rechazadas.',
          variant: 'success',
        })
        router.push('/dashboard/bloqueos')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirmConflicts = async () => {
    if (!pendingPayload) return
    setConflictDialogOpen(false)
    setIsLoading(true)
    try {
      const payloadConCancel = { ...pendingPayload, cancelConflicting: true }
      const result = await submitRequest(payloadConCancel)
      if (result === 'success') {
        toast({
          title: isEditing ? 'Bloqueo actualizado' : 'Bloqueo creado',
          description: `${conflicts.length} reserva(s) cancelada(s) automaticamente.`,
          variant: 'success',
        })
        router.push('/dashboard/bloqueos')
        router.refresh()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
      setPendingPayload(null)
    }
  }

  return (
    <>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
        {/* Motivo */}
        <div className="space-y-2">
          <Label htmlFor="reason">Motivo</Label>
          <Select
            value={form.watch('reason')}
            onValueChange={(val) => form.setValue('reason', val, { shouldValidate: true })}
          >
            <SelectTrigger id="reason">
              <SelectValue placeholder="Selecciona un motivo" />
            </SelectTrigger>
            <SelectContent>
              {MOTIVOS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.reason && (
            <p className="text-sm text-destructive">{form.formState.errors.reason.message}</p>
          )}
        </div>

        {/* Nota */}
        <div className="space-y-2">
          <Label htmlFor="note">Nota (opcional)</Label>
          <Textarea
            id="note"
            {...form.register('note')}
            placeholder="Ej: Reparacion del cesped de la pista 3"
            maxLength={300}
          />
          {form.formState.errors.note && (
            <p className="text-sm text-destructive">{form.formState.errors.note.message}</p>
          )}
        </div>

        {/* Pista */}
        <div className="space-y-2">
          <Label htmlFor="courtId">Pista</Label>
          <Select
            value={form.watch('courtId') || '__all__'}
            onValueChange={(val) => form.setValue('courtId', val === '__all__' ? '' : val, { shouldValidate: true })}
          >
            <SelectTrigger id="courtId">
              <SelectValue placeholder="Todas las pistas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">Todas las pistas</SelectItem>
              {courts.map((court) => (
                <SelectItem key={court.id} value={court.id}>
                  {court.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Fecha */}
        <div className="space-y-2">
          <Label htmlFor="date">Fecha</Label>
          <Input
            id="date"
            type="date"
            {...form.register('date')}
          />
          {form.formState.errors.date && (
            <p className="text-sm text-destructive">{form.formState.errors.date.message}</p>
          )}
        </div>

        {/* Horas */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora de inicio</Label>
            <Select
              value={form.watch('startTime')}
              onValueChange={(val) => form.setValue('startTime', val, { shouldValidate: true })}
            >
              <SelectTrigger id="startTime">
                <SelectValue placeholder="Inicio" />
              </SelectTrigger>
              <SelectContent>
                {HORAS_DISPONIBLES.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.startTime && (
              <p className="text-sm text-destructive">{form.formState.errors.startTime.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Hora de fin</Label>
            <Select
              value={form.watch('endTime')}
              onValueChange={(val) => form.setValue('endTime', val, { shouldValidate: true })}
            >
              <SelectTrigger id="endTime">
                <SelectValue placeholder="Fin" />
              </SelectTrigger>
              <SelectContent>
                {HORAS_DISPONIBLES.map((h) => (
                  <SelectItem key={h.value} value={h.value}>
                    {h.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.endTime && (
              <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
            )}
          </div>
        </div>

        {/* Botones */}
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/dashboard/bloqueos')}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? 'Guardar cambios' : 'Crear bloqueo'}
          </Button>
        </div>
      </form>

      {/* Dialog de conflictos */}
      <AlertDialog open={conflictDialogOpen} onOpenChange={setConflictDialogOpen}>
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Reservas en conflicto
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div>
                <p className="mb-3">
                  Hay {conflicts.length} reserva(s) que se solapan con este bloqueo.
                  Si continuas, se cancelaran automaticamente:
                </p>
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {conflicts.map((c) => (
                    <li key={c.bookingId} className="flex items-center gap-2 text-sm border rounded-md p-2">
                      <span className="font-medium">{c.courtName}</span>
                      <span className="text-muted-foreground">
                        {new Date(c.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                        {' - '}
                        {new Date(c.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="text-muted-foreground">
                        {c.userName || c.guestName || (c.tipo === 'partida-abierta' ? 'Partida abierta' : 'Reserva')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmConflicts}
            >
              Cancelar reservas y crear bloqueo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
