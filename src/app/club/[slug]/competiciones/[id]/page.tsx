import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

const formatLabel: Record<string, string> = {
  LEAGUE: "Liga",
  KNOCKOUT: "Torneo",
  GROUP_AND_KNOCKOUT: "Grupos + Eliminatorias",
};

export default async function ClubCompetitionDetailPage({
  params,
}: {
  params: { slug: string; id: string };
}) {
  const club = await db.club.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!club) notFound();

  const competition = await db.competition.findFirst({
    where: { id: params.id, clubId: club.id },
    include: {
      teams: {
        include: {
          player1: { select: { name: true } },
          player2: { select: { name: true } },
        },
        orderBy: [{ points: 'desc' }, { setsFor: 'desc' }, { gamesFor: 'desc' }],
      },
      matches: {
        include: {
          team1: { select: { name: true } },
          team2: { select: { name: true } },
        },
        orderBy: [{ roundNumber: 'asc' }, { id: 'asc' }],
      },
    },
  });

  if (!competition) notFound();

  // Agrupar partidos por ronda
  const matchesByRound: Record<string, typeof competition.matches> = {};
  for (const match of competition.matches) {
    const key = match.roundName || `Ronda ${match.roundNumber}`;
    if (!matchesByRound[key]) matchesByRound[key] = [];
    matchesByRound[key].push(match);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{competition.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge>{formatLabel[competition.format] || competition.format}</Badge>
            <Badge variant={competition.status === 'ACTIVE' ? 'default' : 'secondary'}>
              {competition.status === 'ACTIVE' ? 'En curso' : 'Finalizada'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Clasificacion (para ligas y grupos) */}
      {(competition.format === 'LEAGUE' || competition.format === 'GROUP_AND_KNOCKOUT') && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Clasificacion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 px-2">#</th>
                    <th className="text-left py-2 px-2">Equipo</th>
                    <th className="text-center py-2 px-1">PJ</th>
                    <th className="text-center py-2 px-1">PG</th>
                    <th className="text-center py-2 px-1">PP</th>
                    <th className="text-center py-2 px-1">SF</th>
                    <th className="text-center py-2 px-1">SC</th>
                    <th className="text-center py-2 px-1 font-bold">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {competition.teams.map((team, i) => (
                    <tr key={team.id} className="border-b last:border-0">
                      <td className="py-2 px-2 font-medium text-muted-foreground">{i + 1}</td>
                      <td className="py-2 px-2">
                        <span className="font-medium">{team.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          ({team.player1?.name} / {team.player2?.name})
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">{team.played}</td>
                      <td className="text-center py-2 px-1">{team.won}</td>
                      <td className="text-center py-2 px-1">{team.lost}</td>
                      <td className="text-center py-2 px-1">{team.setsFor}</td>
                      <td className="text-center py-2 px-1">{team.setsAgainst}</td>
                      <td className="text-center py-2 px-1 font-bold">{team.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Partidos por ronda */}
      {Object.entries(matchesByRound).map(([roundName, matches]) => (
        <Card key={roundName}>
          <CardHeader>
            <CardTitle className="text-base">{roundName}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {matches.map((match) => (
                <div
                  key={match.id}
                  className="flex items-center justify-between p-3 rounded-lg border text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className={`truncate ${match.winnerId === match.team1Id ? 'font-bold' : ''}`}>
                      {match.team1?.name || 'Por definir'}
                    </span>
                  </div>
                  <div className="px-3 shrink-0">
                    {match.result ? (
                      <Badge variant="secondary" className="font-mono">{match.result}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">vs</span>
                    )}
                  </div>
                  <div className="flex items-center justify-end gap-2 flex-1 min-w-0">
                    <span className={`truncate ${match.winnerId === match.team2Id ? 'font-bold' : ''}`}>
                      {match.team2?.name || 'Por definir'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
