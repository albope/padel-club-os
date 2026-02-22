import React from 'react'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BlogForm from '@/components/blog/BlogForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface EditArticuloPageProps {
  params: { id: string }
}

const EditArticuloPage = async ({ params }: EditArticuloPageProps) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect('/login')

  const post = await db.blogPost.findUnique({
    where: { id: params.id },
  })

  if (!post) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" asChild>
          <Link href="/dashboard/blog" className="gap-2">
            <ArrowLeft className="h-5 w-5" />
            Volver al blog
          </Link>
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Articulo no encontrado</h1>
          <p className="mt-2 text-muted-foreground">El articulo no existe.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/blog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Articulo</h1>
          <p className="mt-1 text-muted-foreground">Modificando &quot;{post.title}&quot;</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <BlogForm post={JSON.parse(JSON.stringify(post))} />
      </Card>
    </div>
  )
}

export default EditArticuloPage
