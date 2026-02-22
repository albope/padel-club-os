import React from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import NewsForm from '@/components/noticias/NewsForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const NuevaNoticiaPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/noticias">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nueva Noticia</h1>
          <p className="mt-1 text-muted-foreground">Redacta una nueva noticia para tu club.</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <NewsForm />
      </Card>
    </div>
  )
}

export default NuevaNoticiaPage
