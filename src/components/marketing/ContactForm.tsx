"use client"

import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Send, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
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

const subjectKeys = ["general", "demo", "support", "partnership", "other"] as const

export default function ContactForm() {
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('pages.contact.form')

  const asuntos = useMemo(() =>
    subjectKeys.map((key) => ({
      key,
      label: t(`subjects.${key}`),
    })),
    [t]
  )

  const asuntoValues = useMemo(() => asuntos.map((a) => a.label), [asuntos])

  const ContactoSchema = useMemo(() => z.object({
    nombre: z.string().min(2, t('nameMin')),
    email: z.string().email(t('emailInvalid')),
    asunto: z.string().refine((val) => asuntoValues.includes(val), {
      message: t('subjectRequired'),
    }),
    mensaje: z.string().min(10, t('messageMin')),
  }), [t, asuntoValues])

  type ContactoFormValues = z.infer<typeof ContactoSchema>

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
        throw new Error(data.error || t('errorDesc'))
      }

      toast({
        title: t('successTitle'),
        description: t('successDesc'),
        variant: "success",
      })

      reset()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('errorDesc')
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
        <Label htmlFor="nombre">{t('nameLabel')}</Label>
        <Input
          id="nombre"
          placeholder={t('namePlaceholder')}
          {...register("nombre")}
        />
        {errors.nombre && (
          <p className="text-sm text-destructive">{errors.nombre.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t('emailLabel')}</Label>
        <Input
          id="email"
          type="email"
          placeholder={t('emailPlaceholder')}
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="asunto">{t('subjectLabel')}</Label>
        <Controller
          control={control}
          name="asunto"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger id="asunto">
                <SelectValue placeholder={t('subjectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {asuntos.map((asunto) => (
                  <SelectItem key={asunto.key} value={asunto.label}>
                    {asunto.label}
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
        <Label htmlFor="mensaje">{t('messageLabel')}</Label>
        <Textarea
          id="mensaje"
          placeholder={t('messagePlaceholder')}
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
        {isLoading ? t('submitting') : t('submit')}
      </Button>
    </form>
  )
}
