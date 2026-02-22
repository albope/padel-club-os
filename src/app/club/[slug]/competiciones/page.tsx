import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const formatLabel: Record<string, string> = {
  LEAGUE: "Liga",
  KNOCKOUT: "Torneo",
  GROUP_AND_KNOCKOUT: "Grupos + Eliminatorias",
};

export default async function ClubCompetitionsPage({ params }: { params: { slug: string } }) {
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });

  if (!club) notFound();

  const competitions = await db.competition.findMany({
    where: { clubId: club.id },
    include: {
      teams: { select: { id: true } },
      matches: { select: { id: true, result: true } },
    },
    orderBy: { id: 'desc' },
  });

  const active = competitions.filter(c => c.status === 'ACTIVE');
  const finished = competitions.filter(c => c.status === 'FINISHED');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold uppercase tracking-wide">Competiciones</h1>
        <p className="text-muted-foreground mt-1">Ligas y torneos del club</p>
        <div className="club-accent-line mt-3" />
      </div>

      {/* Activas */}
      {active.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-foreground uppercase tracking-wide">En curso</h2>
          <div className="grid gap-3">
            {active.map((comp) => (
              <Link key={comp.id} href={`/club/${params.slug}/competiciones/${comp.id}`}>
                <div className="club-card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-display font-bold text-sm">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {comp.teams.length} equipos · {comp.matches.filter(m => m.result).length}/{comp.matches.length} partidos jugados
                      </p>
                    </div>
                  </div>
                  <Badge>{formatLabel[comp.format] || comp.format}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Finalizadas */}
      {finished.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-muted-foreground uppercase tracking-wide">Finalizadas</h2>
          <div className="grid gap-3">
            {finished.map((comp) => (
              <Link key={comp.id} href={`/club/${params.slug}/competiciones/${comp.id}`}>
                <div className="club-card p-4 flex items-center justify-between opacity-75">
                  <div className="flex items-center gap-3">
                    <Trophy className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-display font-bold text-sm">{comp.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {comp.teams.length} equipos · {formatLabel[comp.format] || comp.format}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary">Finalizada</Badge>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {competitions.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Trophy className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="font-medium text-foreground">No hay competiciones</p>
            <p className="text-sm text-muted-foreground mt-1">
              El club aún no ha creado competiciones.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
