'use client'

import React, { useState, useEffect } from 'react'
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

const BlogSchema = z.object({
  title: z.string().min(3, "El titulo debe tener al menos 3 caracteres."),
  slug: z
    .string()
    .min(3, "El slug debe tener al menos 3 caracteres.")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Solo letras minusculas, numeros y guiones."
    ),
  content: z.string().min(1, "El contenido es requerido."),
  excerpt: z.string().min(10, "El extracto debe tener al menos 10 caracteres."),
  category: z.string().min(1, "La categoria es requerida."),
  published: z.boolean(),
  imageUrl: z.string().optional(),
  authorName: z.string().min(2, "El nombre del autor es requerido."),
  readTime: z.string().optional(),
})

type BlogFormValues = z.infer<typeof BlogSchema>

interface BlogFormProps {
  post?: {
    id: string
    title: string
    slug: string
    content: string
    excerpt: string
    category: string
    published: boolean
    imageUrl: string | null
    authorName: string
    readTime: string | null
  }
}

const BlogForm: React.FC<BlogFormProps> = ({ post }) => {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!post

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(BlogSchema),
    defaultValues: {
      title: post?.title || '',
      slug: post?.slug || '',
      content: post?.content || '',
      excerpt: post?.excerpt || '',
      category: post?.category || '',
      published: post?.published || false,
      imageUrl: post?.imageUrl || '',
      authorName: post?.authorName || '',
      readTime: post?.readTime || '',
    },
  })

  // Auto-generar slug desde titulo (solo al crear, no al editar)
  const titulo = form.watch('title')
  useEffect(() => {
    if (!isEditing && titulo) {
      const slugGenerado = titulo
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
      form.setValue('slug', slugGenerado, { shouldValidate: true })
    }
  }, [titulo, isEditing, form])

  const onSubmit = async (values: BlogFormValues) => {
    setIsLoading(true)
    try {
      const url = isEditing ? `/api/blog/${post.id}` : '/api/blog'
      const method = isEditing ? 'PATCH' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          imageUrl: values.imageUrl || null,
          readTime: values.readTime || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data.error || 'Error al guardar el articulo.')
      }

      toast({
        title: isEditing ? "Articulo actualizado" : "Articulo creado",
        description: isEditing
          ? "El articulo se ha actualizado correctamente."
          : "El articulo se ha creado correctamente.",
        variant: "success",
      })

      router.push('/dashboard/blog')
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar el articulo.'
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
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="title">Titulo</Label>
          <Input
            id="title"
            {...form.register('title')}
            placeholder="Titulo del articulo"
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">Slug (URL)</Label>
          <Input
            id="slug"
            {...form.register('slug')}
            placeholder="titulo-del-articulo"
          />
          {form.formState.errors.slug && (
            <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">Extracto</Label>
        <Textarea
          id="excerpt"
          {...form.register('excerpt')}
          placeholder="Breve descripcion del articulo para la vista previa..."
          rows={3}
          className="resize-y"
        />
        {form.formState.errors.excerpt && (
          <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">Categoria</Label>
          <Input
            id="category"
            {...form.register('category')}
            placeholder="Producto, Gestion, Consejos..."
          />
          {form.formState.errors.category && (
            <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorName">Autor</Label>
          <Input
            id="authorName"
            {...form.register('authorName')}
            placeholder="Nombre del autor"
          />
          {form.formState.errors.authorName && (
            <p className="text-sm text-destructive">{form.formState.errors.authorName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="readTime">Tiempo de lectura</Label>
          <Input
            id="readTime"
            {...form.register('readTime')}
            placeholder="5 min"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">Contenido</Label>
        <Textarea
          id="content"
          {...form.register('content')}
          placeholder="Escribe el contenido del articulo..."
          rows={15}
          className="resize-y min-h-[300px]"
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
          onClick={() => router.push('/dashboard/blog')}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Guardar Cambios' : 'Crear Articulo'}
        </Button>
      </div>
    </form>
  )
}

export default BlogForm
