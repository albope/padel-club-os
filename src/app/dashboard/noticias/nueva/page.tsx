import React from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NewsForm from '@/components/noticias/NewsForm'

const NuevaNoticiaPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/noticias">
          <span className="flex items-center justify-center p-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300">
            <ArrowLeft className="h-5 w-5" />
          </span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Nueva Noticia</h1>
          <p className="mt-1 text-gray-400">Redacta una nueva noticia para tu club.</p>
        </div>
      </div>
      <div className="bg-gray-800 p-6 sm:p-8 rounded-xl shadow-lg">
        <NewsForm />
      </div>
    </div>
  )
}

export default NuevaNoticiaPage
