'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Competition, CompetitionFormat, CompetitionStatus } from '@prisma/client';
import { Trophy, Users, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';

type CompetitionWithCount = Competition & {
  _count: { teams: number };
};

interface CompetitionsClientProps {
  initialCompetitions: CompetitionWithCount[];
}

const CompetitionsClient: React.FC<CompetitionsClientProps> = ({ initialCompetitions }) => {
  const router = useRouter();
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const [filter, setFilter] = useState<CompetitionStatus>(CompetitionStatus.ACTIVE);
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
  }>({ open: false, title: '', description: '', action: async () => {} });

  React.useEffect(() => {
    setCompetitions(initialCompetitions);
  }, [initialCompetitions]);

  const filteredCompetitions = useMemo(() => {
    return competitions.filter(c => c.status === filter);
  }, [competitions, filter]);

  const formatToText = (format: CompetitionFormat) => {
    switch (format) {
      case 'LEAGUE': return 'Liga';
      case 'KNOCKOUT': return 'Torneo';
      case 'GROUP_AND_KNOCKOUT': return 'Fase de Grupos';
      default: return 'Competición';
    }
  };

  const handleFinish = async (competitionId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Finalizar competición',
      description: '¿Seguro que quieres marcar esta competición como finalizada?',
      action: async () => {
        setIsLoading(competitionId);
        try {
          await fetch(`/api/competitions/${competitionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: CompetitionStatus.FINISHED }),
          });
          setCompetitions(prev => prev.map(c => c.id === competitionId ? { ...c, status: CompetitionStatus.FINISHED } : c));
          toast({ title: "Competición finalizada", description: "La competición se ha marcado como finalizada." });
        } catch (error) {
          toast({ title: "Error", description: "Error al finalizar la competición.", variant: "destructive" });
        } finally {
          setIsLoading(null);
        }
      },
    });
  };

  const handleDelete = async (competitionId: string) => {
    setConfirmDialog({
      open: true,
      title: 'Eliminar competición',
      description: '¡Atención! Vas a eliminar la competición y todos sus datos. Esta acción no se puede deshacer. ¿Continuar?',
      action: async () => {
        setIsLoading(competitionId);
        try {
          await fetch(`/api/competitions/${competitionId}`, { method: 'DELETE' });
          setCompetitions(prev => prev.filter(c => c.id !== competitionId));
          toast({ title: "Competición eliminada", description: "La competición ha sido eliminada." });
        } catch (error) {
          toast({ title: "Error", description: "Error al eliminar la competición.", variant: "destructive" });
        } finally {
          setIsLoading(null);
        }
      },
    });
  };

  return (
    <>
      <Card>
        <div className="p-4 border-b">
          <Tabs value={filter} onValueChange={(value) => setFilter(value as CompetitionStatus)}>
            <TabsList>
              <TabsTrigger value={CompetitionStatus.ACTIVE}>En curso</TabsTrigger>
              <TabsTrigger value={CompetitionStatus.FINISHED}>Finalizadas</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <CardContent className="p-6">
          {filteredCompetitions.length > 0 ? (
            <ul className="space-y-1">
              {filteredCompetitions.map((competition, index) => (
                <React.Fragment key={competition.id}>
                  {index > 0 && <Separator />}
                  <li className="group flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                    <Link href={`/dashboard/competitions/${competition.id}`} className="flex-grow">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-muted rounded-lg"><Trophy className="h-6 w-6 text-yellow-500" /></div>
                        <div>
                          <p className="font-semibold text-foreground group-hover:text-primary">{competition.name}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <Badge variant="secondary">{formatToText(competition.format)}</Badge>
                            <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {competition._count.teams} Equipos</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                    <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center">
                      {isLoading === competition.id ? (
                        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                      ) : (
                        <>
                          {filter === 'ACTIVE' && (
                            <Button variant="outline" size="sm" className="text-green-600 border-green-600/30 hover:bg-green-500/10" onClick={() => handleFinish(competition.id)}>
                              Finalizar
                            </Button>
                          )}
                          <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(competition.id)}>
                            Eliminar
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay competiciones en estado &quot;{filter === 'ACTIVE' ? 'En curso' : 'Finalizadas'}&quot;.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog.description}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await confirmDialog.action();
                setConfirmDialog(prev => ({ ...prev, open: false }));
              }}
              className={confirmDialog.title.includes('Eliminar') ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default CompetitionsClient;
