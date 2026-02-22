'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

const NewsSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres."),
  content: z.string().min(1, "El contenido es requerido."),
  published: z.boolean(),
  imageUrl: z.string().optional(),
})

type NewsFormValues = z.infer<typeof NewsSchema>

interface NewsFormProps {
  noticia?: {
    id: string
    title: string
    content: string
    published: boolean
    imageUrl: string | null
  }
}

const NewsForm: React.FC<NewsFormProps> = ({ noticia }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!noticia

  const form = useForm<NewsFormValues>({
    resolver: zodResolver(NewsSchema),
    defaultValues: {
      title: noticia?.title || '',
      content: noticia?.content || '',
      published: noticia?.published || false,
      imageUrl: noticia?.imageUrl || '',
    },
  })

  const onSubmit = async (values: NewsFormValues) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/news/${noticia.id}` : '/api/news'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          imageUrl: values.imageUrl || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar la noticia.')
      }

      toast({
        title: isEditing ? "Noticia actualizada" : "Noticia creada",
        description: isEditing
          ? "La noticia se ha actualizado correctamente."
          : "La noticia se ha creado correctamente.",
        variant: "success",
      })

      router.push('/dashboard/noticias')
      router.refresh()
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">Titulo</Label>
        <Input
          id="title"
          {...form.register('title')}
          placeholder="Titulo de la noticia"
        />
        {form.formState.errors.title && (
          <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenido</Label>
        <Textarea
          id="content"
          {...form.register('content')}
          placeholder="Escribe el contenido de la noticia..."
          rows={10}
          className="resize-y min-h-[200px]"
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">URL de Imagen (opcional)</Label>
        <Input
          id="imageUrl"
          {...form.register('imageUrl')}
          placeholder="https://ejemplo.com/imagen.jpg"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="published"
          {...form.register('published')}
          className="h-4 w-4 rounded border-input bg-background"
        />
        <Label htmlFor="published" className="cursor-pointer">
          Publicar inmediatamente
        </Label>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/noticias')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar Cambios' : 'Crear Noticia'}
        </Button>
      </div>
    </form>
  )
}

export default NewsForm
