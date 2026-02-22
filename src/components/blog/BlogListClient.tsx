'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { FileText, Pencil, Trash2, Loader2 } from 'lucide-react'
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

interface BlogPostItem {
  id: string
  title: string
  slug: string
  excerpt: string
  category: string
  published: boolean
  authorName: string
  createdAt: string
  updatedAt: string
}

interface BlogListClientProps {
  initialPosts: BlogPostItem[]
}

type FilterType = 'all' | 'published' | 'draft'

const BlogListClient: React.FC<BlogListClientProps> = ({ initialPosts }) => {
  const [posts, setPosts] = useState(initialPosts)
  const [filter, setFilter] = useState<FilterType>('all')
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean
    title: string
    description: string
    action: () => Promise<void>
  }>({ open: false, title: '', description: '', action: async () => {} })

  React.useEffect(() => {
    setPosts(initialPosts)
  }, [initialPosts])

  const filteredPosts = useMemo(() => {
    switch (filter) {
      case 'published':
        return posts.filter(p => p.published)
      case 'draft':
        return posts.filter(p => !p.published)
      default:
        return posts
    }
  }, [posts, filter])

  const handleDelete = (postId: string, title: string) => {
    setConfirmDialog({
      open: true,
      title: 'Eliminar articulo',
      description: `¿Seguro que quieres eliminar "${title}"? Esta accion no se puede deshacer.`,
      action: async () => {
        setIsLoading(postId)
        try {
          const response = await fetch(`/api/blog/${postId}`, { method: 'DELETE' })
          if (!response.ok) throw new Error('Error al eliminar')
          setPosts(prev => prev.filter(p => p.id !== postId))
          toast({
            title: "Articulo eliminado",
            description: "El articulo ha sido eliminado correctamente.",
          })
        } catch {
          toast({
            title: "Error",
            description: "No se pudo eliminar el articulo.",
            variant: "destructive",
          })
        } finally {
          setIsLoading(null)
        }
      },
    })
  }

  const handleTogglePublish = async (post: BlogPostItem) => {
    setIsLoading(post.id)
    try {
      const response = await fetch(`/api/blog/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !post.published }),
      })
      if (!response.ok) throw new Error('Error al actualizar')
      setPosts(prev =>
        prev.map(p =>
          p.id === post.id ? { ...p, published: !p.published } : p
        )
      )
      toast({
        title: post.published ? "Articulo despublicado" : "Articulo publicado",
        description: post.published
          ? "El articulo ya no es visible en el blog."
          : "El articulo ahora es visible en el blog.",
      })
    } catch {
      toast({
        title: "Error",
        description: "No se pudo actualizar el articulo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(null)
    }
  }

  const filterLabel = (f: FilterType) => {
    switch (f) {
      case 'all': return 'Todos'
      case 'published': return 'Publicados'
      case 'draft': return 'Borradores'
    }
  }

  return (
    <>
      <Card>
        <div className="p-4 border-b">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as FilterType)}>
            <TabsList>
              <TabsTrigger value="all">Todos ({posts.length})</TabsTrigger>
              <TabsTrigger value="published">Publicados ({posts.filter(p => p.published).length})</TabsTrigger>
              <TabsTrigger value="draft">Borradores ({posts.filter(p => !p.published).length})</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="p-6">
          {filteredPosts.length > 0 ? (
            <ul className="space-y-1">
              {filteredPosts.map((item, index) => (
                <React.Fragment key={item.id}>
                  {index > 0 && <Separator />}
                  <li className="group flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                    <Link href={`/dashboard/blog/${item.id}`} className="flex-grow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg">
                          <FileText className="h-6 w-6 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-foreground group-hover:text-primary">
                            {item.title}
                          </p>
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
                            {item.excerpt}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <Badge variant="outline" className="text-xs">
                              {item.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              /{item.slug}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {item.authorName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(item.createdAt).toLocaleDateString('es-ES', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                            <Badge variant={item.published ? 'default' : 'secondary'}>
                              {item.published ? 'Publicado' : 'Borrador'}
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
                            {item.published ? 'Despublicar' : 'Publicar'}
                          </Button>
                          <Link href={`/dashboard/blog/${item.id}`}>
                            <Button variant="outline" size="sm">
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
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No hay articulos en &quot;{filterLabel(filter)}&quot;.
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
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action()
                setConfirmDialog(prev => ({ ...prev, open: false }))
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default BlogListClient
