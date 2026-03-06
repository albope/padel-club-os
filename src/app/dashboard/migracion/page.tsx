import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import MigracionWizard from '@/components/migracion/MigracionWizard'
import { getTranslations } from 'next-intl/server'

export default async function MigracionPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.clubId) redirect('/login')

  const t = await getTranslations('migration')
  const clubId = session.user.clubId

  const [club, courtCount, memberCount] = await Promise.all([
    db.club.findUnique({
      where: { id: clubId },
      select: {
        bookingDuration: true,
        maxAdvanceBooking: true,
        cancellationHours: true,
        enableOpenMatches: true,
        enablePlayerBooking: true,
      },
    }),
    db.court.count({ where: { clubId } }),
    db.user.count({ where: { clubId, role: 'PLAYER' } }),
  ])

  if (!club) redirect('/login')

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
      </div>
      <MigracionWizard
        club={{
          bookingDuration: club.bookingDuration ?? 90,
          maxAdvanceBooking: club.maxAdvanceBooking ?? 7,
          cancellationHours: club.cancellationHours ?? 2,
          enableOpenMatches: club.enableOpenMatches,
          enablePlayerBooking: club.enablePlayerBooking,
        }}
        courtCount={courtCount}
        memberCount={memberCount}
      />
    </div>
  )
}
