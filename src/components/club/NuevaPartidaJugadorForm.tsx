'use client';

import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

interface Pista {
  id: string;
  name: string;
  type: string;
}

interface NuevaPartidaJugadorFormProps {
  slug: string;
  onExito: () => void;
}

export default function NuevaPartidaJugadorForm({ slug, onExito }: NuevaPartidaJugadorFormProps) {
  const [pistas, setPistas] = useState<Pista[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [courtId, setCourtId] = useState('');
  const [matchDate, setMatchDate] = useState(() => {
    const hoy = new Date();
    return hoy.toISOString().split('T')[0];
  });
  const [matchTime, setMatchTime] = useState('10:00');
  const [levelMin, setLevelMin] = useState('');
  const [levelMax, setLevelMax] = useState('');

  useEffect(() => {
    async function loadPistas() {
      try {
        const res = await fetch(`/api/club/${slug}/courts`);
        if (res.ok) {
          const data = await res.json();
          setPistas(data);
          if (data.length > 0) setCourtId(data[0].id);
        }
      } catch { /* silenciar */ }
      finally { setIsLoading(false); }
    }
    loadPistas();
  }, [slug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courtId || !matchDate || !matchTime) return;

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/player/open-matches/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId,
          matchDate,
          matchTime,
          levelMin: levelMin || undefined,
          levelMax: levelMax || undefined,
        }),
      });

      if (res.ok) {
        toast({
          title: "Partida creada",
          description: "Tu partida abierta ha sido creada. Ya estas inscrito.",
        });
        onExito();
      } else {
        const data = await res.json();
        toast({
          title: "Error",
          description: data.error || "No se pudo crear la partida.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Error de conexion.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="courtId">Pista</Label>
        <select
          id="courtId"
          value={courtId}
          onChange={(e) => setCourtId(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          required
        >
          {pistas.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.type})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="matchDate">Fecha</Label>
          <Input
            id="matchDate"
            type="date"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="matchTime">Hora</Label>
          <Input
            id="matchTime"
            type="time"
            value={matchTime}
            onChange={(e) => setMatchTime(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="levelMin">Nivel minimo (opcional)</Label>
          <Input
            id="levelMin"
            type="number"
            step="0.25"
            min="1"
            max="7"
            value={levelMin}
            onChange={(e) => setLevelMin(e.target.value)}
            placeholder="Ej: 3.0"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="levelMax">Nivel maximo (opcional)</Label>
          <Input
            id="levelMax"
            type="number"
            step="0.25"
            min="1"
            max="7"
            value={levelMax}
            onChange={(e) => setLevelMax(e.target.value)}
            placeholder="Ej: 4.5"
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Al crear la partida, quedas inscrito automaticamente como primer jugador.
      </p>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Creando...</>
        ) : (
          'Crear partida'
        )}
      </Button>
    </form>
  );
}
