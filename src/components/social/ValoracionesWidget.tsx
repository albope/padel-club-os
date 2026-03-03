'use client';

import { useState, useEffect } from 'react';
import { Star, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { EstrellasInput } from './EstrellasInput';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';

interface Companero {
  userId: string;
  nombre: string;
  imagen: string | null;
  yaValorado: boolean;
}

interface PartidaPendiente {
  openMatchId: string;
  matchTime: string;
  courtName: string;
  companeros: Companero[];
}

interface ValoracionesWidgetProps {
  slug: string;
}

export function ValoracionesWidget({ slug }: ValoracionesWidgetProps) {
  const t = useTranslations('social');
  const locale = useLocale();
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB';

  const [partidas, setPartidas] = useState<PartidaPendiente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<PartidaPendiente | null>(null);
  const [selectedCompanero, setSelectedCompanero] = useState<Companero | null>(null);
  const [estrellas, setEstrellas] = useState(0);
  const [comentario, setComentario] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchPendientes();
  }, []);

  const fetchPendientes = async () => {
    try {
      const res = await fetch('/api/player/ratings/pending');
      if (res.ok) {
        const data = await res.json();
        setPartidas(data.partidas);
      }
    } catch { /* silenciar */ }
    finally { setIsLoading(false); }
  };

  const abrirValoracion = (partida: PartidaPendiente, companero: Companero) => {
    setSelectedMatch(partida);
    setSelectedCompanero(companero);
    setEstrellas(0);
    setComentario('');
    setDialogOpen(true);
  };

  const enviarValoracion = async () => {
    if (!selectedMatch || !selectedCompanero || estrellas === 0) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/player/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          openMatchId: selectedMatch.openMatchId,
          ratedUserId: selectedCompanero.userId,
          stars: estrellas,
          comment: comentario.trim() || undefined,
        }),
      });

      if (res.ok) {
        toast({ title: t('ratingSuccess'), description: t('ratingSuccessDesc'), variant: 'success' });
        setDialogOpen(false);
        fetchPendientes(); // Refrescar
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error, variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Error de conexion.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || partidas.length === 0) return null;

  const totalPendientes = partidas.reduce(
    (acc, p) => acc + p.companeros.filter((c) => !c.yaValorado).length,
    0
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Star className="h-5 w-5" />
            {t('rateCompanions')}
            <Badge variant="secondary" className="ml-auto">
              {totalPendientes}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('rateCompanionsDesc')}</p>
          {partidas.map((partida) => (
            <div key={partida.openMatchId} className="rounded-lg border p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Badge variant="secondary">{partida.courtName}</Badge>
                <span className="font-medium">
                  {new Date(partida.matchTime).toLocaleDateString(localeCode, {
                    weekday: 'short', day: 'numeric', month: 'short',
                  })}
                </span>
                <span className="text-muted-foreground">
                  {new Date(partida.matchTime).toLocaleTimeString(localeCode, {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {partida.companeros.map((c) => (
                  <Button
                    key={c.userId}
                    variant={c.yaValorado ? 'outline' : 'secondary'}
                    size="sm"
                    disabled={c.yaValorado}
                    onClick={() => abrirValoracion(partida, c)}
                    className="gap-1.5"
                  >
                    {c.imagen ? (
                      <Image src={c.imagen} alt={c.nombre} width={20} height={20} className="h-5 w-5 rounded-full object-cover" />
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-semibold">
                        {c.nombre.charAt(0)}
                      </div>
                    )}
                    {c.nombre}
                    {c.yaValorado && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Dialog de valoracion */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('ratePlayer', { name: selectedCompanero?.nombre || '' })}</DialogTitle>
            <DialogDescription className="sr-only">
              {t('yourRating')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('yourRating')}</p>
              <EstrellasInput value={estrellas} onChange={setEstrellas} size="lg" />
              {estrellas > 0 && (
                <p className="text-xs text-muted-foreground">
                  {estrellas === 1 && t('stars1')}
                  {estrellas === 2 && t('stars2')}
                  {estrellas === 3 && t('stars3')}
                  {estrellas === 4 && t('stars4')}
                  {estrellas === 5 && t('stars5')}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">{t('comment')}</p>
              <Textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                placeholder={t('commentPlaceholder')}
                maxLength={280}
                rows={3}
              />
              <p className="text-xs text-muted-foreground text-right">
                {comentario.length}/280
              </p>
            </div>
            <Button
              onClick={enviarValoracion}
              disabled={estrellas === 0 || isSubmitting}
              className="w-full"
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {t('submitRating')}...</>
              ) : (
                t('submitRating')
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
