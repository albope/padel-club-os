import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import SetupWizard from '@/components/onboarding/SetupWizard'

const ConfiguracionInicialPage = async () => {
  const session = await getServerSession(authOptions)

  if (!session?.user?.clubId) {
    redirect('/login')
  }

  const [club, courts] = await Promise.all([
    db.club.findUnique({
      where: { id: session.user.clubId },
      select: {
        name: true,
        slug: true,
        description: true,
        phone: true,
        email: true,
        openingTime: true,
        closingTime: true,
      },
    }),
    db.court.findMany({
      where: { clubId: session.user.clubId },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, type: true },
    }),
  ])

  if (!club) {
    redirect('/login')
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Configuracion inicial</h1>
        <p className="mt-1 text-muted-foreground">
          Configura los aspectos basicos de tu club en unos minutos.
        </p>
      </div>
      <SetupWizard
        club={JSON.parse(JSON.stringify(club))}
        existingCourts={JSON.parse(JSON.stringify(courts))}
      />
    </div>
  )
}

export default ConfiguracionInicialPage
