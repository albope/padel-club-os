'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Megaphone, Loader2, Send } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from '@/hooks/use-toast'

const BroadcastSchema = z.object({
  titulo: z.string().min(1, "El titulo es requerido").max(100, "Maximo 100 caracteres"),
  mensaje: z.string().min(1, "El mensaje es requerido").max(500, "Maximo 500 caracteres"),
})

type BroadcastFormValues = z.infer<typeof BroadcastSchema>

interface BroadcastDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const BroadcastDialog: React.FC<BroadcastDialogProps> = ({ open, onOpenChange }) => {
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<BroadcastFormValues>({
    resolver: zodResolver(BroadcastSchema),
    defaultValues: { titulo: '', mensaje: '' },
  })

  const onSubmit = async (data: BroadcastFormValues) => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || 'Error al enviar la comunicacion')
      }
      toast({
        title: 'Comunicacion enviada',
        description: 'Todos los jugadores del club recibiran la notificacion.',
        variant: 'success',
      })
      form.reset()
      onOpenChange(false)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error desconocido'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Megaphone className="h-5 w-5" />
            Enviar Comunicacion
          </DialogTitle>
          <DialogDescription>
            Envia una notificacion a todos los jugadores de tu club.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Titulo</Label>
            <Input
              id="titulo"
              {...form.register('titulo')}
              aria-required="true"
              aria-invalid={!!form.formState.errors.titulo}
              aria-describedby={form.formState.errors.titulo ? "titulo-error" : undefined}
              placeholder="Ej: Torneo de verano"
              disabled={isLoading}
            />
            {form.formState.errors.titulo && (
              <p id="titulo-error" role="alert" className="text-sm text-destructive">{form.formState.errors.titulo.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="mensaje">Mensaje</Label>
            <Textarea
              id="mensaje"
              {...form.register('mensaje')}
              aria-required="true"
              aria-invalid={!!form.formState.errors.mensaje}
              aria-describedby={form.formState.errors.mensaje ? "mensaje-error" : undefined}
              placeholder="Escribe el mensaje que recibiran todos los jugadores..."
              rows={4}
              disabled={isLoading}
            />
            <div className="flex justify-between">
              {form.formState.errors.mensaje && (
                <p id="mensaje-error" role="alert" className="text-sm text-destructive">{form.formState.errors.mensaje.message}</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                {form.watch('mensaje')?.length || 0}/500
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar a Todos
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default BroadcastDialog
