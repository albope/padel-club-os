"use client"

import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Send, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"

const asuntos = [
  "Informacion general",
  "Quiero una demo",
  "Soporte tecnico",
  "Colaboracion / Partnership",
  "Otro",
] as const

const ContactoSchema = z.object({
  nombre: z.string().min(2, "El nombre debe tener al menos 2 caracteres."),
  email: z.string().email("Email no valido."),
  asunto: z.enum(asuntos, {
    errorMap: () => ({ message: "Selecciona un asunto." }),
  }),
  mensaje: z.string().min(10, "El mensaje debe tener al menos 10 caracteres."),
})

type ContactoFormValues = z.infer<typeof ContactoSchema>

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<ContactoFormValues>({
    resolver: zodResolver(ContactoSchema),
    defaultValues: {
      nombre: "",
      email: "",
      asunto: undefined,
      mensaje: "",
    },
  })

  const onSubmit = async (values: ContactoFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || "Error al enviar el mensaje.")
      }

      toast({
        title: "Mensaje enviado",
        description:
          "Hemos recibido tu mensaje. Te responderemos lo antes posible.",
        variant: "success",
      })

      reset()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Error al enviar el mensaje."
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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border bg-card p-6 md:p-8"
    >
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input
          id="nombre"
          placeholder="Tu nombre completo"
          {...register("nombre")}
        />
        {errors.nombre && (
          <p className="text-sm text-destructive">{errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="tu@email.com"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="asunto">Asunto</Label>
        <Controller
          control={control}
          name="asunto"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger id="asunto">
                <SelectValue placeholder="Selecciona un asunto" />
              </SelectTrigger>
              <SelectContent>
                {asuntos.map((asunto) => (
                  <SelectItem key={asunto} value={asunto}>
                    {asunto}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.asunto && (
          <p className="text-sm text-destructive">{errors.asunto.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje">Mensaje</Label>
        <Textarea
          id="mensaje"
          placeholder="Cuentanos como podemos ayudarte..."
          className="min-h-[120px]"
          {...register("mensaje")}
        />
        {errors.mensaje && (
          <p className="text-sm text-destructive">{errors.mensaje.message}</p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="w-full gap-2 text-base"
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
        {isLoading ? "Enviando..." : "Enviar mensaje"}
      </Button>
    </form>
  )
}
