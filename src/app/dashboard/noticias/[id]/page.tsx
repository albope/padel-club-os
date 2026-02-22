import React from 'react'
import { db } from '@/lib/db'
import { authOptions } from '@/lib/auth'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NewsForm from '@/components/noticias/NewsForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

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
        <Button variant="ghost" asChild>
          <Link href="/dashboard/noticias" className="gap-2">
            <ArrowLeft className="h-5 w-5" />
            Volver a noticias
          </Link>
        </Button>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold">Noticia no encontrada</h1>
          <p className="mt-2 text-muted-foreground">La noticia no existe o no pertenece a tu club.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/noticias">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Noticia</h1>
          <p className="mt-1 text-muted-foreground">Modificando &quot;{noticia.title}&quot;</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <NewsForm noticia={JSON.parse(JSON.stringify(noticia))} />
      </Card>
    </div>
  )
}

export default EditNoticiaPage
