import React from 'react'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import BlogListClient from '@/components/blog/BlogListClient'
import { Button } from '@/components/ui/button'

const BlogAdminPage = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) {
    redirect('/dashboard')
  }

  const posts = await db.blogPost.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Blog</h1>
          <p className="mt-1 text-muted-foreground">Crea y administra los articulos del blog de la plataforma.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/blog/nuevo">
            <PlusCircle className="h-5 w-5" />
            Nuevo Articulo
          </Link>
        </Button>
      </div>

      <BlogListClient initialPosts={JSON.parse(JSON.stringify(posts))} />
    </div>
  )
}

export default BlogAdminPage
