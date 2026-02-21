import React from 'react'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { PlusCircle } from 'lucide-react'
import Link from 'next/link'
import NoticiasClient from '@/components/noticias/NoticiasClient'

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
          <h1 className="text-3xl font-bold text-white">Gestion de Noticias</h1>
          <p className="mt-1 text-gray-400">Crea y administra las noticias de tu club.</p>
        </div>
        <Link href="/dashboard/noticias/nueva">
          <span className="flex items-center gap-2 px-4 py-2 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500">
            <PlusCircle className="h-5 w-5" />
            Nueva Noticia
          </span>
        </Link>
      </div>

      <NoticiasClient initialNews={JSON.parse(JSON.stringify(news))} />
    </div>
  )
}

export default NoticiasPage
