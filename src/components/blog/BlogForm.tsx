'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

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
  const t = useTranslations('blogAdmin.form')
  const tc = useTranslations('common')
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!post

  const BlogSchema = useMemo(() => z.object({
    title: z.string().min(3, t('titleMin')),
    slug: z
      .string()
      .min(3, t('slugMin'))
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        t('slugFormat')
      ),
    content: z.string().min(1, t('contentRequired')),
    excerpt: z.string().min(10, t('excerptMin')),
    category: z.string().min(1, t('categoryRequired')),
    published: z.boolean(),
    imageUrl: z.string().optional(),
    authorName: z.string().min(2, t('authorRequired')),
    readTime: z.string().optional(),
  }), [t])

  type BlogFormValues = z.infer<typeof BlogSchema>

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
        throw new Error(data.error || t('saveError'))
      }

      toast({
        title: isEditing ? t('updated') : t('created'),
        description: isEditing
          ? t('updatedDesc')
          : t('createdDesc'),
        variant: "success",
      })

      router.push('/dashboard/blog')
      router.refresh()
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('saveError')
      toast({
        title: tc('error'),
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
          <Label htmlFor="title">{t('titleLabel')}</Label>
          <Input
            id="title"
            {...form.register('title')}
            placeholder={t('titlePlaceholder')}
          />
          {form.formState.errors.title && (
            <p className="text-sm text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="slug">{t('slugLabel')}</Label>
          <Input
            id="slug"
            {...form.register('slug')}
            placeholder={t('slugPlaceholder')}
          />
          {form.formState.errors.slug && (
            <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="excerpt">{t('excerptLabel')}</Label>
        <Textarea
          id="excerpt"
          {...form.register('excerpt')}
          placeholder={t('excerptPlaceholder')}
          rows={3}
          className="resize-y"
        />
        {form.formState.errors.excerpt && (
          <p className="text-sm text-destructive">{form.formState.errors.excerpt.message}</p>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">{t('categoryLabel')}</Label>
          <Input
            id="category"
            {...form.register('category')}
            placeholder={t('categoryPlaceholder')}
          />
          {form.formState.errors.category && (
            <p className="text-sm text-destructive">{form.formState.errors.category.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="authorName">{t('authorLabel')}</Label>
          <Input
            id="authorName"
            {...form.register('authorName')}
            placeholder={t('authorPlaceholder')}
          />
          {form.formState.errors.authorName && (
            <p className="text-sm text-destructive">{form.formState.errors.authorName.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="readTime">{t('readTimeLabel')}</Label>
          <Input
            id="readTime"
            {...form.register('readTime')}
            placeholder={t('readTimePlaceholder')}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="content">{t('contentLabel')}</Label>
        <Textarea
          id="content"
          {...form.register('content')}
          placeholder={t('contentPlaceholder')}
          rows={15}
          className="resize-y min-h-[300px]"
        />
        {form.formState.errors.content && (
          <p className="text-sm text-destructive">{form.formState.errors.content.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="imageUrl">{t('imageUrl')}</Label>
        <Input
          id="imageUrl"
          {...form.register('imageUrl')}
          placeholder={t('imagePlaceholder')}
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
          {t('publishNow')}
        </Label>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/dashboard/blog')}
        >
          {tc('cancel')}
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? t('save') : t('create')}
        </Button>
      </div>
    </form>
  )
}

export default BlogForm
