'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const DIAS_SEMANA = [
  { value: "1", label: "Lunes" },
  { value: "2", label: "Martes" },
  { value: "3", label: "Miercoles" },
  { value: "4", label: "Jueves" },
  { value: "5", label: "Viernes" },
  { value: "6", label: "Sabado" },
  { value: "0", label: "Domingo" },
]

// Horas disponibles de 07:00 a 23:00 en intervalos de 30 min
const HORAS_DISPONIBLES = Array.from({ length: 33 }, (_, i) => {
  const hora = Math.floor(i / 2) + 7
  const minuto = i % 2 === 0 ? 0 : 30
  return {
    value: `${hora}:${minuto}`,
    label: `${hora.toString().padStart(2, "0")}:${minuto.toString().padStart(2, "0")}`,
    hora,
    minuto,
  }
})

const FormSchema = z.object({
  description: z.string().max(200).optional(),
  courtId: z.string().min(1, "Selecciona una pista."),
  dayOfWeek: z.string().min(1, "Selecciona un dia."),
  startTime: z.string().min(1, "Selecciona hora de inicio."),
  endTime: z.string().min(1, "Selecciona hora de fin."),
  assignType: z.enum(["socio", "invitado"]),
  userId: z.string().optional(),
  guestName: z.string().max(100).optional(),
  startsAt: z.string().min(1, "Selecciona fecha de inicio."),
  endsAt: z.string().min(1, "Selecciona fecha de fin."),
}).refine(
  (d) => {
    if (d.assignType === "socio") return !!d.userId
    return !!d.guestName
  },
  { message: "Selecciona un socio o introduce nombre de invitado.", path: ["userId"] }
)

type FormValues = z.infer<typeof FormSchema>

interface Court {
  id: string
  name: string
}

interface UserOption {
  id: string
  name: string | null
  email: string | null
}

interface RecurringBookingData {
  id: string
  description: string | null
  dayOfWeek: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  courtId: string
  userId: string | null
  guestName: string | null
  startsAt: string
  endsAt: string
  isActive: boolean
}

interface RecurringBookingFormProps {
  courts: Court[]
  users: UserOption[]
  recurringBooking?: RecurringBookingData
}

export default function RecurringBookingForm({
  courts,
  users,
  recurringBooking,
}: RecurringBookingFormProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!recurringBooking

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: recurringBooking?.description || '',
      courtId: recurringBooking?.courtId || '',
      dayOfWeek: recurringBooking ? String(recurringBooking.dayOfWeek) : '',
      startTime: recurringBooking
        ? `${recurringBooking.startHour}:${recurringBooking.startMinute}`
        : '',
      endTime: recurringBooking
        ? `${recurringBooking.endHour}:${recurringBooking.endMinute}`
        : '',
      assignType: recurringBooking?.userId ? 'socio' : recurringBooking?.guestName ? 'invitado' : 'socio',
      userId: recurringBooking?.userId || '',
      guestName: recurringBooking?.guestName || '',
      startsAt: recurringBooking ? recurringBooking.startsAt.split('T')[0] : '',
      endsAt: recurringBooking ? recurringBooking.endsAt.split('T')[0] : '',
    },
  })

  const assignType = form.watch('assignType')

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true)
    try {
      const [startHour, startMinute] = values.startTime.split(':').map(Number)
      const [endHour, endMinute] = values.endTime.split(':').map(Number)

      const payload = {
        description: values.description || undefined,
        courtId: values.courtId,
        dayOfWeek: parseInt(values.dayOfWeek),
        startHour,
        startMinute,
        endHour,
        endMinute,
        userId: values.assignType === 'socio' ? values.userId : undefined,
        guestName: values.assignType === 'invitado' ? values.guestName : undefined,
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      }

      const url = isEditing
        ? `/api/recurring-bookings/${recurringBooking.id}`
        : '/api/recurring-bookings'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar la reserva recurrente.')
      }

      toast({
        title: isEditing ? "Reserva recurrente actualizada" : "Reserva recurrente creada",
        description: isEditing
          ? "Los cambios se han guardado correctamente."
          : "Se generaran reservas automaticamente segun la configuracion.",
        variant: "success",
      })

      router.push('/dashboard/reservas-recurrentes')
      router.refresh()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Descripcion */}
      <div className="space-y-2">
        <Label htmlFor="description">Descripcion (opcional)</Label>
        <Input
          id="description"
          {...form.register('description')}
          placeholder="Ej: Clase de Juan y Maria"
        />
        {form.formState.errors.description && (
          <p className="text-sm text-destructive">{form.formState.errors.description.message}</p>
        )}
      </div>

      {/* Pista */}
      <div className="space-y-2">
        <Label htmlFor="courtId">Pista</Label>
        <Select
          value={form.watch('courtId')}
          onValueChange={(val) => form.setValue('courtId', val, { shouldValidate: true })}
        >
          <SelectTrigger id="courtId">
            <SelectValue placeholder="Selecciona una pista" />
          </SelectTrigger>
          <SelectContent>
            {courts.map((court) => (
              <SelectItem key={court.id} value={court.id}>
                {court.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.courtId && (
          <p className="text-sm text-destructive">{form.formState.errors.courtId.message}</p>
        )}
      </div>

      {/* Dia de la semana */}
      <div className="space-y-2">
        <Label htmlFor="dayOfWeek">Dia de la semana</Label>
        <Select
          value={form.watch('dayOfWeek')}
          onValueChange={(val) => form.setValue('dayOfWeek', val, { shouldValidate: true })}
        >
          <SelectTrigger id="dayOfWeek">
            <SelectValue placeholder="Selecciona un dia" />
          </SelectTrigger>
          <SelectContent>
            {DIAS_SEMANA.map((dia) => (
              <SelectItem key={dia.value} value={dia.value}>
                {dia.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.dayOfWeek && (
          <p className="text-sm text-destructive">{form.formState.errors.dayOfWeek.message}</p>
        )}
      </div>

      {/* Horas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startTime">Hora de inicio</Label>
          <Select
            value={form.watch('startTime')}
            onValueChange={(val) => {
              form.setValue('startTime', val, { shouldValidate: true })
              // Auto-calcular hora fin (90 min por defecto)
              const [h, m] = val.split(':').map(Number)
              const endMin = h * 60 + m + 90
              const endH = Math.floor(endMin / 60)
              const endM = endMin % 60
              if (endH <= 23) {
                form.setValue('endTime', `${endH}:${endM}`, { shouldValidate: true })
              }
            }}
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

      {/* Asignacion: Socio o Invitado */}
      <div className="space-y-2">
        <Label>Asignar a</Label>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="socio"
              {...form.register('assignType')}
              className="h-4 w-4"
            />
            <span className="text-sm">Socio del club</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              value="invitado"
              {...form.register('assignType')}
              className="h-4 w-4"
            />
            <span className="text-sm">Invitado</span>
          </label>
        </div>
      </div>

      {assignType === 'socio' ? (
        <div className="space-y-2">
          <Label htmlFor="userId">Socio</Label>
          <Select
            value={form.watch('userId') || ''}
            onValueChange={(val) => form.setValue('userId', val, { shouldValidate: true })}
          >
            <SelectTrigger id="userId">
              <SelectValue placeholder="Selecciona un socio" />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name || user.email || 'Sin nombre'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.userId && (
            <p className="text-sm text-destructive">{form.formState.errors.userId.message}</p>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="guestName">Nombre del invitado</Label>
          <Input
            id="guestName"
            {...form.register('guestName')}
            placeholder="Nombre completo"
          />
          {form.formState.errors.guestName && (
            <p className="text-sm text-destructive">{form.formState.errors.guestName.message}</p>
          )}
        </div>
      )}

      {/* Fechas */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startsAt">Fecha de inicio</Label>
          <Input
            id="startsAt"
            type="date"
            {...form.register('startsAt')}
          />
          {form.formState.errors.startsAt && (
            <p className="text-sm text-destructive">{form.formState.errors.startsAt.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="endsAt">Fecha de fin</Label>
          <Input
            id="endsAt"
            type="date"
            {...form.register('endsAt')}
          />
          {form.formState.errors.endsAt && (
            <p className="text-sm text-destructive">{form.formState.errors.endsAt.message}</p>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/reservas-recurrentes')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar cambios' : 'Crear reserva recurrente'}
        </Button>
      </div>
    </form>
  )
}
