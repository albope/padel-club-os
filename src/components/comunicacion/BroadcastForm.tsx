"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/hooks/use-toast"
import { Loader2, Send, Users } from "lucide-react"

const BroadcastFormSchema = z.object({
  titulo: z.string().min(1, "El titulo es requerido").max(100, "Maximo 100 caracteres"),
  mensaje: z.string().min(1, "El mensaje es requerido").max(2000, "Maximo 2000 caracteres"),
  segmento: z.string().min(1, "Selecciona un segmento"),
  nivelValor: z.string().optional(),
})

type BroadcastFormValues = z.infer<typeof BroadcastFormSchema>

export default function BroadcastForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [canalPush, setCanalPush] = useState(true)
  const [canalEmail, setCanalEmail] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<BroadcastFormValues>({
    resolver: zodResolver(BroadcastFormSchema),
    defaultValues: {
      titulo: "",
      mensaje: "",
      segmento: "all",
      nivelValor: "",
    },
  })

  const segmento = watch("segmento")
  const nivelValor = watch("nivelValor")

  // Resolver segmento real (con nivel si aplica)
  const segmentoReal = segmento === "level" && nivelValor ? `level:${nivelValor}` : segmento

  // Preview de destinatarios con debounce
  const fetchPreview = useCallback(async (seg: string) => {
    if (!seg || seg === "level") {
      setPreviewCount(null)
      return
    }
    setPreviewLoading(true)
    try {
      const res = await fetch(`/api/broadcasts/preview?segmento=${encodeURIComponent(seg)}`)
      if (res.ok) {
        const data = await res.json()
        setPreviewCount(data.count)
      }
    } catch {
      setPreviewCount(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview(segmentoReal)
    }, 300)
    return () => clearTimeout(timer)
  }, [segmentoReal, fetchPreview])

  const onSubmit = async (values: BroadcastFormValues) => {
    if (!canalPush && !canalEmail) {
      toast({
        title: "Error",
        description: "Selecciona al menos un canal de envio.",
        variant: "destructive",
      })
      return
    }
    setConfirmOpen(true)
  }

  const confirmarEnvio = async () => {
    setConfirmOpen(false)
    setLoading(true)

    const values = watch()
    const canales = canalPush && canalEmail
      ? "push+email"
      : canalPush
        ? "push"
        : "email"

    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: values.titulo,
          mensaje: values.mensaje,
          canales,
          segmento: segmentoReal,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Error al enviar la comunicacion")
      }

      const data = await res.json()
      toast({
        title: "Comunicacion enviada",
        description: `El comunicado se esta enviando a ${data.recipientCount} socios.`,
        variant: "success",
      })
      router.push("/dashboard/comunicacion")
      router.refresh()
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo enviar la comunicacion.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Titulo */}
        <div className="space-y-2">
          <Label htmlFor="titulo">Titulo del comunicado</Label>
          <Input
            id="titulo"
            placeholder="Titulo que veran los socios"
            {...register("titulo")}
            maxLength={100}
          />
          {errors.titulo && (
            <p className="text-sm text-destructive">{errors.titulo.message}</p>
          )}
        </div>

        {/* Mensaje */}
        <div className="space-y-2">
          <Label htmlFor="mensaje">Mensaje</Label>
          <Textarea
            id="mensaje"
            placeholder="Escribe el contenido del comunicado..."
            className="min-h-[150px]"
            {...register("mensaje")}
            maxLength={2000}
          />
          {errors.mensaje && (
            <p className="text-sm text-destructive">{errors.mensaje.message}</p>
          )}
        </div>

        {/* Canales */}
        <div className="space-y-3">
          <Label>Canales de envio</Label>
          <div className="flex flex-col gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canal-push"
                checked={canalPush}
                onCheckedChange={(checked) => setCanalPush(!!checked)}
              />
              <Label htmlFor="canal-push" className="font-normal cursor-pointer">
                Notificacion push (incluye in-app)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="canal-email"
                checked={canalEmail}
                onCheckedChange={(checked) => setCanalEmail(!!checked)}
              />
              <Label htmlFor="canal-email" className="font-normal cursor-pointer">
                Correo electronico
              </Label>
            </div>
          </div>
          {!canalPush && !canalEmail && (
            <p className="text-sm text-destructive">Selecciona al menos un canal.</p>
          )}
        </div>

        {/* Segmento */}
        <div className="space-y-2">
          <Label>Destinatarios</Label>
          <Select
            value={segmento}
            onValueChange={(value) => setValue("segmento", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecciona destinatarios" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los jugadores</SelectItem>
              <SelectItem value="active">Solo activos</SelectItem>
              <SelectItem value="inactive">Solo inactivos</SelectItem>
              <SelectItem value="level">Por nivel</SelectItem>
            </SelectContent>
          </Select>

          {/* Campo nivel cuando se selecciona "Por nivel" */}
          {segmento === "level" && (
            <div className="space-y-2 mt-2">
              <Label htmlFor="nivelValor">Nivel</Label>
              <Input
                id="nivelValor"
                placeholder="Ej: 3.5"
                {...register("nivelValor")}
                maxLength={10}
              />
            </div>
          )}
        </div>

        {/* Preview count */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <Users className="h-4 w-4 shrink-0" />
          {previewLoading ? (
            <span className="flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Calculando destinatarios...
            </span>
          ) : previewCount !== null ? (
            previewCount > 0 ? (
              <span>
                Se enviara a <strong className="text-foreground">{previewCount}</strong> {previewCount === 1 ? "socio" : "socios"}
              </span>
            ) : (
              <span className="text-destructive">No hay socios que coincidan con este filtro</span>
            )
          ) : segmento === "level" && !nivelValor ? (
            <span>Introduce un nivel para ver los destinatarios</span>
          ) : (
            <span>Selecciona un segmento</span>
          )}
        </div>

        {/* Boton enviar */}
        <Button
          type="submit"
          disabled={loading || previewCount === 0 || previewCount === null}
          className="w-full sm:w-auto"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Enviar comunicacion
            </>
          )}
        </Button>
      </form>

      {/* Dialog de confirmacion */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar envio</AlertDialogTitle>
            <AlertDialogDescription>
              Vas a enviar una comunicacion a{" "}
              <strong>{previewCount}</strong> {previewCount === 1 ? "socio" : "socios"}.
              Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEnvio}>
              Enviar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
