'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTranslations, useLocale } from 'next-intl'
import { Newspaper, Pencil, Trash2, Loader2 } from 'lucide-react'
import EmptyState from '@/components/onboarding/EmptyState'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/hooks/use-toast'

interface NewsItem {
  id: string
  title: string
  content: string
  published: boolean
  imageUrl: string | null
  createdAt: string
  updatedAt: string
}

interface NoticiasClientProps {
  initialNews: NewsItem[]
}

type FilterType = 'all' | 'published' | 'draft'

const NoticiasClient: React.FC<NoticiasClientProps> = ({ initialNews }) => {
  const router = useRouter()
  const t = useTranslations('noticias')
  const tc = useTranslations('common')
  const locale = useLocale()
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB'
  const [news, setNews] = useState(initialNews)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => Promise<void>
  }>({ open: false, title: '', description: '', action: async () => {} })

  React.useEffect(() => {
    setNews(initialNews)
  }, [initialNews])

  const filteredNews = useMemo(() => {
    switch (filter) {
      case 'published':
        return news.filter(n => n.published)
      case 'draft':
        return news.filter(n => !n.published)
      default:
        return news
    }
  }, [news, filter])

  const handleDelete = (newsId: string, title: string) => {
    setConfirmDialog({
      open: true,
      title: t('deleteTitle'),
      description: `¿${title}? ${t('deleteConfirm')}`,
      action: async () => {
        setIsLoading(newsId)
        try {
          const response = await fetch(`/api/news/${newsId}`, { method: 'DELETE' })
          if (!response.ok) throw new Error('Error al eliminar')
          setNews(prev => prev.filter(n => n.id !== newsId))
          toast({
            title: t('deleted'),
            description: t('deletedDesc'),
          })
        } catch (error) {
          toast({
            title: tc('error'),
            description: t('deleteError'),
            variant: "destructive",
          })
        } finally {
          setIsLoading(null)
        }
      },
    })
  }

  const handleTogglePublish = async (newsItem: NewsItem) => {
    setIsLoading(newsItem.id)
    try {
      const response = await fetch(`/api/news/${newsItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !newsItem.published }),
      })
      if (!response.ok) throw new Error('Error al actualizar')
      setNews(prev =>
        prev.map(n =>
          n.id === newsItem.id ? { ...n, published: !n.published } : n
        )
      )
      toast({
        title: newsItem.published ? t('unpublished') : t('published'),
        description: newsItem.published
          ? t('unpublishedDesc')
          : t('publishedDesc'),
      })
    } catch (error) {
      toast({
        title: tc('error'),
        description: t('toggleError'),
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const filterLabel = (f: FilterType) => {
    switch (f) {
      case 'all': return t('all')
      case 'published': return t('publishedFilter')
      case 'draft': return t('drafts')
    }
  }

  if (news.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Newspaper}
            title={t('emptyPublished')}
            description={t('emptyPublishedDesc')}
            actionLabel={t('createFirst')}
            actionHref="/dashboard/noticias/nueva"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <div className="p-4 border-b">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">{t('all')} ({news.length})</TabsTrigger>
              <TabsTrigger value="published">{t('publishedFilter')} ({news.filter(n => n.published).length})</TabsTrigger>
              <TabsTrigger value="draft">{t('drafts')} ({news.filter(n => !n.published).length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="p-6">
          {filteredNews.length > 0 ? (
            <ul className="space-y-1">
              {filteredNews.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <Separator />}
                  <li className="group flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                    <Link href={`/dashboard/noticias/${item.id}`} className="flex-grow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <Newspaper className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {item.content}
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString(localeCode, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <Badge variant={item.published ? 'default' : 'secondary'}>
                              {item.published ? t('publishedBadge') : t('draftBadge')}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center">
                      {isLoading === item.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleTogglePublish(item)}
                          >
                            {item.published ? t('unpublishAction') : t('publishAction')}
                          </Button>
                          <Link href={`/dashboard/noticias/${item.id}`}>
                            <Button variant="outline" size="sm" aria-label={tc('edit')}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-destructive border-destructive/30 hover:bg-destructive/10"
                            onClick={() => handleDelete(item.id, item.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {t('noNewsIn')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action()
                setConfirmDialog(prev => ({ ...prev, open: false }))
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default NoticiasClient
