"use client"

import { useState, useMemo } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams, usePathname } from "next/navigation"
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

const COURTS_MAP: Record<string, number> = {
  "1-4": 2,
  "5-8": 6,
  "9-12": 10,
  "13-20": 16,
  "20+": 21,
}

const SOFTWARE_VALUES = ["ninguno", "matchpoint", "playtomic", "doinsport", "otro"] as const
const URGENCY_VALUES = ["urgente", "proximo-mes", "explorando"] as const

export default function DemoLeadForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const t = useTranslations("pages.demo.form")

  const source = searchParams.get("source") || undefined
  const utmSource = searchParams.get("utm_source") || undefined
  const utmMedium = searchParams.get("utm_medium") || undefined
  const utmCampaign = searchParams.get("utm_campaign") || undefined

  const DemoSchema = useMemo(
    () =>
      z.object({
        nombre: z.string().min(2, t("nameMin")),
        email: z.string().email(t("emailInvalid")),
        telefono: z.string().optional(),
        clubNombre: z.string().min(1, t("clubNameRequired")),
        courts: z.string().min(1, t("courtsRequired")),
        softwareActual: z.string().min(1, t("softwareRequired")),
        urgencia: z.string().min(1, t("urgencyRequired")),
        mensaje: z.string().optional(),
      }),
    [t]
  )

  type DemoFormValues = z.infer<typeof DemoSchema>

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<DemoFormValues>({
    resolver: zodResolver(DemoSchema),
    defaultValues: {
      nombre: "",
      email: "",
      telefono: "",
      clubNombre: "",
      courts: undefined,
      softwareActual: undefined,
      urgencia: undefined,
      mensaje: "",
    },
  })

  const onSubmit = async (values: DemoFormValues) => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: values.nombre,
          email: values.email,
          telefono: values.telefono || undefined,
          clubNombre: values.clubNombre,
          numeroPistas: COURTS_MAP[values.courts] || 2,
          softwareActual: values.softwareActual,
          urgencia: values.urgencia,
          mensaje: values.mensaje || undefined,
          paginaOrigen: pathname,
          source,
          utmSource,
          utmMedium,
          utmCampaign,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        if (response.status === 429) {
          throw new Error(t("rateLimitError"))
        }
        throw new Error(data.error || t("errorDesc"))
      }

      router.push("/gracias-demo")
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t("errorDesc")
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const courtsOptions = useMemo(
    () => [
      { value: "1-4", label: t("courts1_4") },
      { value: "5-8", label: t("courts5_8") },
      { value: "9-12", label: t("courts9_12") },
      { value: "13-20", label: t("courts13_20") },
      { value: "20+", label: t("courts20plus") },
    ],
    [t]
  )

  const softwareOptions = useMemo(
    () => [
      { value: SOFTWARE_VALUES[0], label: t("softwareNone") },
      { value: SOFTWARE_VALUES[1], label: t("softwareMatchpoint") },
      { value: SOFTWARE_VALUES[2], label: t("softwarePlaytomic") },
      { value: SOFTWARE_VALUES[3], label: t("softwareDoinsport") },
      { value: SOFTWARE_VALUES[4], label: t("softwareOther") },
    ],
    [t]
  )

  const urgencyOptions = useMemo(
    () => [
      { value: URGENCY_VALUES[0], label: t("urgencyUrgent") },
      { value: URGENCY_VALUES[1], label: t("urgencyNextMonth") },
      { value: URGENCY_VALUES[2], label: t("urgencyExploring") },
    ],
    [t]
  )

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border bg-card p-6 md:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {/* Nombre */}
        <div className="space-y-2">
          <Label htmlFor="nombre">{t("nameLabel")}</Label>
          <Input
            id="nombre"
            placeholder={t("namePlaceholder")}
            aria-required="true"
            aria-invalid={!!errors.nombre}
            aria-describedby={errors.nombre ? "nombre-error" : undefined}
            {...register("nombre")}
          />
          {errors.nombre && (
            <p id="nombre-error" role="alert" className="text-sm text-destructive">
              {errors.nombre.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email">{t("emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("emailPlaceholder")}
            aria-required="true"
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email && (
            <p id="email-error" role="alert" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Telefono */}
        <div className="space-y-2">
          <Label htmlFor="telefono">{t("phoneLabel")}</Label>
          <Input
            id="telefono"
            type="tel"
            placeholder={t("phonePlaceholder")}
            {...register("telefono")}
          />
        </div>

        {/* Club */}
        <div className="space-y-2">
          <Label htmlFor="clubNombre">{t("clubNameLabel")}</Label>
          <Input
            id="clubNombre"
            placeholder={t("clubNamePlaceholder")}
            aria-required="true"
            aria-invalid={!!errors.clubNombre}
            aria-describedby={errors.clubNombre ? "clubNombre-error" : undefined}
            {...register("clubNombre")}
          />
          {errors.clubNombre && (
            <p id="clubNombre-error" role="alert" className="text-sm text-destructive">
              {errors.clubNombre.message}
            </p>
          )}
        </div>

        {/* Pistas */}
        <div className="space-y-2">
          <Label htmlFor="courts">{t("courtsLabel")}</Label>
          <Controller
            control={control}
            name="courts"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger id="courts" aria-required="true" aria-invalid={!!errors.courts}>
                  <SelectValue placeholder={t("courtsPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {courtsOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.courts && (
            <p role="alert" className="text-sm text-destructive">
              {errors.courts.message}
            </p>
          )}
        </div>

        {/* Software actual */}
        <div className="space-y-2">
          <Label htmlFor="softwareActual">{t("softwareLabel")}</Label>
          <Controller
            control={control}
            name="softwareActual"
            render={({ field }) => (
              <Select onValueChange={field.onChange} value={field.value || ""}>
                <SelectTrigger id="softwareActual" aria-required="true" aria-invalid={!!errors.softwareActual}>
                  <SelectValue placeholder={t("softwarePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {softwareOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.softwareActual && (
            <p role="alert" className="text-sm text-destructive">
              {errors.softwareActual.message}
            </p>
          )}
        </div>
      </div>

      {/* Urgencia - full width */}
      <div className="space-y-2">
        <Label htmlFor="urgencia">{t("urgencyLabel")}</Label>
        <Controller
          control={control}
          name="urgencia"
          render={({ field }) => (
            <Select onValueChange={field.onChange} value={field.value || ""}>
              <SelectTrigger id="urgencia" aria-required="true" aria-invalid={!!errors.urgencia}>
                <SelectValue placeholder={t("urgencyPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {urgencyOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        {errors.urgencia && (
          <p role="alert" className="text-sm text-destructive">
            {errors.urgencia.message}
          </p>
        )}
      </div>

      {/* Mensaje */}
      <div className="space-y-2">
        <Label htmlFor="mensaje">{t("messageLabel")}</Label>
        <Textarea
          id="mensaje"
          placeholder={t("messagePlaceholder")}
          className="min-h-[100px]"
          {...register("mensaje")}
        />
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
        {isLoading ? t("submitting") : t("submit")}
      </Button>
    </form>
  )
}
