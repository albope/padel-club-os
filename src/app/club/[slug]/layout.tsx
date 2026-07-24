import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClubLayout from "@/components/club/ClubLayout";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const revalidate = 3600 // 1h

interface ClubLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, logoUrl: true, isPublished: true },
  });

  if (!club) return { title: "Club no encontrado" };

  const descripcion = club.description || `Portal del club ${club.name} - Reservas, partidas y mas`;

  return {
    title: {
      default: club.name,
      template: `%s | ${club.name}`,
    },
    description: descripcion,
    openGraph: {
      title: club.name,
      description: descripcion,
      url: `/club/${params.slug}`,
      ...(club.logoUrl && {
        images: [{ url: club.logoUrl, alt: club.name }],
      }),
    },
    alternates: {
      canonical: `/club/${params.slug}`,
    },
    ...(!club.isPublished ? { robots: { index: false, follow: false } } : {}),
  };
}

export default async function ClubSlugLayout(props: ClubLayoutProps) {
  const params = await props.params;

  const {
    children
  } = props;

  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      bannerUrl: true,
      instagramUrl: true,
      facebookUrl: true,
      enableOpenMatches: true,
      enablePlayerBooking: true,
      isPublished: true,
    },
  });

  if (!club) notFound();
  if (!club.isPublished) {
    const session = await getServerSession(authOptions)
    const puedePrevisualizar = session?.user?.role === "SUPER_ADMIN"
      || (
        session?.user?.clubId === club.id
        && Boolean(session.user.role)
        && ["CLUB_ADMIN", "STAFF"].includes(session.user.role!)
      )
    if (!puedePrevisualizar) notFound()
  }

  return (
    <div
      style={{
        '--club-primary': club.primaryColor || '#4f46e5',
      } as React.CSSProperties}
    >
      <ClubLayout club={club}>
        {children}
      </ClubLayout>
    </div>
  );
}
