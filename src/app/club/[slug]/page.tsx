import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import ClubHome from "@/components/club/ClubHome";

export default async function ClubHomePage({ params }: { params: { slug: string } }) {
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      address: true,
      phone: true,
      email: true,
      openingTime: true,
      closingTime: true,
      primaryColor: true,
      bannerUrl: true,
      instagramUrl: true,
      facebookUrl: true,
      enableOpenMatches: true,
      enablePlayerBooking: true,
    },
  });

  if (!club) notFound();

  // Obtener proximas partidas abiertas
  const openMatches = await db.openMatch.findMany({
    where: {
      clubId: club.id,
      status: "OPEN",
      matchTime: { gte: new Date() },
    },
    include: {
      court: { select: { name: true } },
      players: { include: { user: { select: { name: true } } } },
    },
    orderBy: { matchTime: 'asc' },
    take: 3,
  });

  // Obtener competiciones activas
  const competitions = await db.competition.findMany({
    where: { clubId: club.id, status: "ACTIVE" },
    select: { id: true, name: true, format: true },
    take: 5,
  });

  // Obtener noticias publicadas
  const news = await db.news.findMany({
    where: { clubId: club.id, published: true },
    orderBy: { createdAt: 'desc' },
    take: 3,
  });

  return (
    <ClubHome
      club={club}
      openMatches={openMatches}
      competitions={competitions}
      news={news}
    />
  );
}
