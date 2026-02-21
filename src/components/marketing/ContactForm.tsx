"use client"

import { Send } from "lucide-react"
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
]

export default function ContactForm() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    toast({
      title: "Proximamente",
      description:
        "El formulario de contacto estara disponible pronto. Mientras tanto, escribenos a contacto@padelclubos.com.",
    })
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 rounded-xl border bg-card p-6 md:p-8"
    >
      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre</Label>
        <Input id="nombre" placeholder="Tu nombre completo" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" placeholder="tu@email.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="asunto">Asunto</Label>
        <Select>
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="mensaje">Mensaje</Label>
        <Textarea
          id="mensaje"
          placeholder="Cuentanos como podemos ayudarte..."
          className="min-h-[120px]"
        />
      </div>

      <Button type="submit" size="lg" className="w-full gap-2 text-base">
        Enviar mensaje
        <Send className="h-4 w-4" />
      </Button>
    </form>
  )
}
