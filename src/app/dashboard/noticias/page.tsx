import React from 'react'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import NoticiasClient from '@/components/noticias/NoticiasClient'
import { Button } from '@/components/ui/button'

const NoticiasPage = async () => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) {
    redirect('/dashboard')
  }

  const news = await db.news.findMany({
    where: { clubId: session.user.clubId },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Gestion de Noticias</h1>
          <p className="mt-1 text-muted-foreground">Crea y administra las noticias de tu club.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/noticias/nueva">
            <PlusCircle className="h-5 w-5" />
            Nueva Noticia
          </Link>
        </Button>
      </div>

      <NoticiasClient initialNews={JSON.parse(JSON.stringify(news))} />
    </div>
  )
}

export default NoticiasPage
