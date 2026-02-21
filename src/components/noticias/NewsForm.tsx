'use client'

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

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
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-300">
          Titulo
        </label>
        <input
          id="title"
          {...form.register('title')}
          placeholder="Titulo de la noticia"
          className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3"
        />
        {form.formState.errors.title && (
          <p className="mt-1 text-sm text-red-400">{form.formState.errors.title.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium text-gray-300">
          Contenido
        </label>
        <textarea
          id="content"
          {...form.register('content')}
          placeholder="Escribe el contenido de la noticia..."
          rows={10}
          className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3 resize-y min-h-[200px]"
        />
        {form.formState.errors.content && (
          <p className="mt-1 text-sm text-red-400">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-300">
          URL de Imagen (opcional)
        </label>
        <input
          id="imageUrl"
          {...form.register('imageUrl')}
          placeholder="https://ejemplo.com/imagen.jpg"
          className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3"
        />
      </div>

      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="published"
          {...form.register('published')}
          className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-indigo-600 focus:ring-indigo-500"
        />
        <label htmlFor="published" className="text-sm font-medium text-gray-300">
          Publicar inmediatamente
        </label>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => router.push('/dashboard/noticias')}
          className="px-4 py-2 text-sm font-medium text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:opacity-50"
        >
          {isLoading ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : null}
          {isEditing ? 'Guardar Cambios' : 'Crear Noticia'}
        </button>
      </div>
    </form>
  )
}

export default NewsForm
