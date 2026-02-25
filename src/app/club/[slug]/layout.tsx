import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClubLayout from "@/components/club/ClubLayout";

interface ClubLayoutProps {
  children: React.ReactNode;
  params: { slug: string };
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { name: true, description: true, logoUrl: true },
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
  };
}

export default async function ClubSlugLayout({ children, params }: ClubLayoutProps) {
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
    },
  });

  if (!club) notFound();

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
