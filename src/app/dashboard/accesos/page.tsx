import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { AccessCenterClient, type SupportAccess } from '@/components/platform/AccessCenterClient'

export default async function AccessCenterPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.role || !hasPermission(session.user.role, 'platform:manage')) {
    redirect('/dashboard')
  }

  const memberships = await db.clubMembership.findMany({
    where: {
      status: 'ACTIVE',
      role: { in: ['CLUB_ADMIN', 'STAFF', 'PLAYER'] },
      user: { isActive: true },
    },
    select: {
      id: true,
      role: true,
      user: { select: { id: true, name: true, email: true } },
      club: {
        select: {
          id: true,
          name: true,
          slug: true,
          esDemo: true,
          isPublished: true,
        },
      },
    },
    orderBy: [
      { club: { name: 'asc' } },
      { role: 'asc' },
      { user: { name: 'asc' } },
    ],
    take: 1000,
  })

  const accesses: SupportAccess[] = memberships.flatMap((membership) => {
    if (!membership.user.email) return []
    return [{
      membershipId: membership.id,
      userId: membership.user.id,
      userName: membership.user.name || membership.user.email,
      userEmail: membership.user.email,
      role: membership.role as SupportAccess['role'],
      clubId: membership.club.id,
      clubName: membership.club.name,
      clubSlug: membership.club.slug,
      isDemo: membership.club.esDemo,
      isPublished: membership.club.isPublished,
    }]
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Centro de accesos</h1>
        <p className="text-muted-foreground">
          Abre el portal público o accede temporalmente como una persona concreta para soporte y demos.
        </p>
      </div>
      <AccessCenterClient accesses={accesses} />
    </div>
  )
}
