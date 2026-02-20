'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OpenMatch, Court } from '@prisma/client';
import { Calendar, Clock, MapPin, Users, ShieldCheck, Hourglass, XCircle, Pencil, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from '@/hooks/use-toast';

type MatchWithDetails = OpenMatch & {
  court: { name: string };
  players: { user: { id: string; name: string | null } }[];
};

interface PartidasAbiertasClientProps {
  initialMatches: MatchWithDetails[];
  clubName: string;
}

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M16.6 14.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.7-.8.9-.1.1-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.2.4-.4.1-.1.2-.2.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.5 2.3 3.6 3.2.5.2.8.3 1.1.4.5.1 1-.1 1.3-.3.4-.3.6-.8.8-1 .1-.2.1-.4 0-.5m-4.6 5.8c-2.9 0-5.5-1.2-7.5-3.1L2 18.8l1.6-1.5C2 15.3 1 12.8 1 10.1c0-4.9 4-8.9 8.9-8.9s8.9 4 8.9 8.9c0 4.9-4 8.9-8.9 8.9m0-19.5C5.2 1.5 1.5 5.2 1.5 10.1c0 2.9 1.4 5.6 3.6 7.2L3 22.5l5.2-1.9c1.5.8 3.2 1.3 4.8 1.3 5.4 0 9.8-4.4 9.8-9.8S17.4 1.5 12 1.5" />
  </svg>
);

const getStatusBadge = (status: MatchWithDetails['status']) => {
  switch (status) {
    case 'OPEN':
      return { text: 'Abierta', variant: 'secondary' as const, icon: Hourglass, className: 'text-blue-600 bg-blue-500/10 border-blue-500/20' };
    case 'FULL':
      return { text: 'Completa', variant: 'secondary' as const, icon: Users, className: 'text-yellow-600 bg-yellow-500/10 border-yellow-500/20' };
    case 'CONFIRMED':
      return { text: 'Confirmada', variant: 'secondary' as const, icon: ShieldCheck, className: 'text-green-600 bg-green-500/10 border-green-500/20' };
    case 'CANCELLED':
      return { text: 'Cancelada', variant: 'secondary' as const, icon: XCircle, className: 'text-red-600 bg-red-500/10 border-red-500/20' };
    default:
      return { text: 'Desconocido', variant: 'secondary' as const, icon: Hourglass, className: '' };
  }
};

const PartidaCard: React.FC<{ match: MatchWithDetails; onDelete: (matchId: string) => void; isLoading: boolean; clubName: string; }> = ({ match, onDelete, isLoading, clubName }) => {
  const statusInfo = getStatusBadge(match.status);
  const StatusIcon = statusInfo.icon;

  let levelText = null;
  if (match.levelMin && match.levelMax) {
    levelText = `${match.levelMin} - ${match.levelMax}`;
  } else if (match.levelMin) {
    levelText = `Desde ${match.levelMin}`;
  } else if (match.levelMax) {
    levelText = `Hasta ${match.levelMax}`;
  }

  const handleShare = () => {
    const date = new Date(match.matchTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
    const time = new Date(match.matchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
    const openSlots = 4 - match.players.length;

    let message = `*¡Partida de pádel abierta en ${clubName}!*\n\n`;
    message += `*Fecha:* ${date}\n`;
    message += `*Hora:* ${time}h\n`;
    message += `*Pista:* ${match.court.name}\n`;
    if (levelText) {
      message += `*Nivel:* ${levelText}\n`;
    }
    message += `\n*Jugadores apuntados (${match.players.length}/4):*\n`;
    match.players.forEach((p, index) => {
      message += `${index + 1}. ${p.user.name}\n`;
    });

    if (openSlots > 0) {
      message += `\n*¡Faltan ${openSlots} jugadores${openSlots > 1 ? 'es' : ''}!*`;
    } else {
      message += `\n*¡Partida completa!*`;
    }

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <Card className="flex flex-col justify-between">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="flex items-center gap-2 font-semibold text-foreground"><MapPin className="h-4 w-4 text-muted-foreground" /> {match.court.name}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground mt-1"><Calendar className="h-4 w-4" /> {new Date(match.matchTime).toLocaleDateString('es-ES')}</p>
            <p className="flex items-center gap-2 text-sm text-muted-foreground"><Clock className="h-4 w-4" /> {new Date(match.matchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
            {levelText && (
              <p className="flex items-center gap-2 text-sm text-muted-foreground"><BarChart3 className="h-4 w-4" /> Nivel: {levelText}</p>
            )}
          </div>
          <Badge variant={statusInfo.variant} className={statusInfo.className}>
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusInfo.text}
          </Badge>
        </div>

        <Separator />

        <div className="pt-4">
          <h4 className="font-semibold text-muted-foreground mb-2">Jugadores ({match.players.length}/4)</h4>
          <div className="space-y-2">
            {match.players.map((p, index) => (
              <p key={p.user.id} className="text-sm text-foreground">
                {index + 1}. {p.user.name}
              </p>
            ))}
            {[...Array(4 - match.players.length)].map((_, index) => (
              <p key={index} className="text-sm text-muted-foreground italic">
                {match.players.length + index + 1}. Slot abierto...
              </p>
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4 flex justify-end gap-2">
        <Button className="flex-grow bg-green-600 hover:bg-green-500 text-white" onClick={handleShare}>
          <WhatsAppIcon />
          Compartir
        </Button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => onDelete(match.id)} disabled={isLoading}>
                <XCircle className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Cancelar Partida</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="outline" size="icon" asChild>
                <Link href={`/dashboard/partidas-abiertas/${match.id}`}>
                  <Pencil className="h-5 w-5" />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Editar Partida</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

const PartidasAbiertasClient: React.FC<PartidasAbiertasClientProps> = ({ initialMatches, clubName }) => {
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [matchToDelete, setMatchToDelete] = useState<string | null>(null);

  const handleRequestDelete = (matchId: string) => {
    setMatchToDelete(matchId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!matchToDelete) return;
    setDeleteDialogOpen(false);
    setIsLoading(true);
    try {
      await fetch(`/api/open-matches/${matchToDelete}`, { method: 'DELETE' });
      setMatches(prev => prev.filter(m => m.id !== matchToDelete));
      toast({ title: "Partida cancelada", description: "La partida ha sido cancelada correctamente." });
    } catch (error) {
      toast({ title: "Error", description: "Error al cancelar la partida.", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setMatchToDelete(null);
    }
  };

  return (
    <>
      <div>
        {matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map(match => (
              <PartidaCard key={match.id} match={match} onDelete={handleRequestDelete} isLoading={isLoading} clubName={clubName} />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-16">
              <p className="text-muted-foreground">No hay ninguna partida abierta en este momento.</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Haz clic en &quot;Abrir Partida&quot; para crear una.</p>
            </CardContent>
          </Card>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar partida</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres cancelar esta partida? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Volver</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Cancelar Partida
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PartidasAbiertasClient;
