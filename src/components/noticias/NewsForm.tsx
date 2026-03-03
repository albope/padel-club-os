'use client'

import React, { useState, useMemo } from 'react'
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
  const t = useTranslations('noticias.form')
  const tc = useTranslations('common')
  const [isLoading, setIsLoading] = useState(false)
  const isEditing = !!noticia

  const NewsSchema = useMemo(() => z.object({
    title: z.string().min(3, t('titleMin')),
    content: z.string().min(1, t('contentRequired')),
    published: z.boolean(),
    imageUrl: z.string().optional(),
  }), [t])

  type NewsFormValues = z.infer<typeof NewsSchema>

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
        throw new Error(data.error || t('saveError'))
      }

      toast({
        title: isEditing ? t('updated') : t('created'),
        description: isEditing
          ? t('updatedDesc')
          : t('createdDesc'),
        variant: "success",
      })

      router.push('/dashboard/noticias')
      router.refresh()
    } catch (err: any) {
      toast({
        title: tc('error'),
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
        <Label htmlFor="content">{t('contentLabel')}</Label>
        <Textarea
          id="content"
          {...form.register('content')}
          placeholder={t('contentPlaceholder')}
          rows={10}
          className="resize-y min-h-[200px]"
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
          onClick={() => router.push('/dashboard/noticias')}
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

export default NewsForm
