import React from 'react'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NewsForm from '@/components/noticias/NewsForm'

interface EditNoticiaPageProps {
  params: { id: string }
}

const EditNoticiaPage = async ({ params }: EditNoticiaPageProps) => {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect('/login')

  const noticia = await db.news.findUnique({
    where: { id: params.id, clubId: session.user.clubId },
  })

  if (!noticia) {
    return (
      <div className="space-y-4">
        <Link href="/dashboard/noticias">
          <span className="flex items-center gap-2 text-gray-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
            Volver a noticias
          </span>
        </Link>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-white">Noticia no encontrada</h1>
          <p className="mt-2 text-gray-400">La noticia no existe o no pertenece a tu club.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/noticias">
          <span className="flex items-center justify-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
            <ArrowLeft className="h-5 w-5" />
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Editar Noticia</h1>
          <p className="mt-1 text-gray-400">Modificando &quot;{noticia.title}&quot;</p>
        </div>
      </div>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <NewsForm noticia={JSON.parse(JSON.stringify(noticia))} />
      </div>
    </div>
  )
}

export default EditNoticiaPage
