import React from 'react'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import BlogForm from '@/components/blog/BlogForm'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

const NuevoArticuloPage = () => {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/blog">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nuevo Articulo</h1>
          <p className="mt-1 text-muted-foreground">Redacta un nuevo articulo para el blog.</p>
        </div>
      </div>
      <Card className="p-6 sm:p-8">
        <BlogForm />
      </Card>
    </div>
  )
}

export default NuevoArticuloPage
