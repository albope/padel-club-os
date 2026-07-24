"use client"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { Bug, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/hooks/use-toast"

const CATEGORIES = [
  ["BUG", "Algo no funciona"],
  ["UX", "Es dificil de usar"],
  ["PERFORMANCE", "Va lento"],
  ["DATA", "Datos incorrectos"],
  ["SUGGESTION", "Sugerencia"],
  ["OTHER", "Otro"],
] as const

export function FeedbackWidget() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [category, setCategory] = useState<(typeof CATEGORIES)[number][0]>("BUG")
  const [description, setDescription] = useState("")
  const [sending, setSending] = useState(false)

  if (status !== "authenticated" || !session?.user) return null

  const enviar = async () => {
    if (description.trim().length < 10) {
      toast({
        title: "Falta un poco de detalle",
        description: "Describe en una frase que ocurrio y que esperabas.",
        variant: "destructive",
      })
      return
    }
    setSending(true)
    try {
      const response = await fetch("/api/bug-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          pageUrl: pathname,
          viewport: `${window.innerWidth}x${window.innerHeight}`,
          metadata: { locale: document.documentElement.lang },
        }),
      })
      const data = await response.json().catch(() => null)
      if (!response.ok) throw new Error(data?.error || "No se pudo enviar.")
      setDescription("")
      setOpen(false)
      toast({
        title: "Reporte recibido",
        description: "Gracias. Ya tenemos el contexto tecnico para revisarlo.",
        variant: "success",
      })
    } catch (error) {
      toast({
        title: "No se pudo enviar",
        description: error instanceof Error ? error.message : "Prueba de nuevo.",
        variant: "destructive",
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-5 md:right-5">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="h-9 gap-2 rounded-full bg-background/95 px-3 shadow-md backdrop-blur"
            aria-label="Informar de un problema o enviar una sugerencia"
          >
            <Bug className="h-4 w-4" />
            <span className="hidden sm:inline">Enviar feedback</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cuéntanos qué ha pasado</DialogTitle>
            <DialogDescription>
              Adjuntaremos automaticamente la pagina y datos tecnicos basicos, nunca contraseñas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-category">Tipo</Label>
              <select
                id="feedback-category"
                value={category}
                onChange={(event) => setCategory(event.target.value as typeof category)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {CATEGORIES.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-description">¿Qué ocurrió?</Label>
              <Textarea
                id="feedback-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                maxLength={4000}
                rows={5}
                placeholder="Ej.: Al confirmar la reserva esperaba volver al calendario, pero la pantalla se quedo cargando."
              />
              <p className="text-right text-xs text-muted-foreground">
                {description.length}/4000
              </p>
            </div>
            <Button onClick={enviar} disabled={sending} className="w-full">
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
