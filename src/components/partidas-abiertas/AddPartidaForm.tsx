'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Court, User, OpenMatch } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const PartidaSchema = z.object({
  courtId: z.string().min(1, "Debes seleccionar una pista."),
  matchDate: z.string().min(1, "La fecha es requerida."),
  matchTime: z.string().min(1, "La hora es requerida."),
  playerIds: z.array(z.string()).min(1, "Debes seleccionar al menos un jugador inicial.").max(4, "No puedes seleccionar mas de 4 jugadores."),
  levelMin: z.coerce.number().min(1, "El nivel debe ser mayor que 0.").optional().or(z.literal('')),
  levelMax: z.coerce.number().min(1, "El nivel debe ser mayor que 0.").optional().or(z.literal('')),
}).refine(data => {
  if (data.levelMin && data.levelMax) {
    return data.levelMin <= data.levelMax;
  }
  return true;
}, {
  message: "El nivel minimo no puede ser mayor que el maximo.",
  path: ["levelMin"],
});

type PartidaToEdit = (OpenMatch & { players: { userId: string }[] });

interface AddPartidaFormProps {
  courts: Court[];
  users: User[];
  partidaToEdit?: PartidaToEdit;
}

const AddPartidaForm: React.FC<AddPartidaFormProps> = ({ courts, users, partidaToEdit }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!partidaToEdit;

  const form = useForm<z.infer<typeof PartidaSchema>>({
    resolver: zodResolver(PartidaSchema),
    defaultValues: { playerIds: [] },
  });

  useEffect(() => {
    if (isEditMode && partidaToEdit) {
      const matchDate = new Date(partidaToEdit.matchTime);
      form.reset({
        courtId: partidaToEdit.courtId,
        matchDate: matchDate.toISOString().split('T')[0],
        matchTime: matchDate.toTimeString().split(' ')[0].substring(0, 5),
        playerIds: partidaToEdit.players.map(p => p.userId),
        levelMin: partidaToEdit.levelMin || undefined,
        levelMax: partidaToEdit.levelMax || undefined,
      });
    }
  }, [isEditMode, partidaToEdit, form]);

  const onSubmit = async (values: z.infer<typeof PartidaSchema>) => {
    setIsLoading(true);
    setError(null);

    const url = isEditMode ? `/api/open-matches/${partidaToEdit!.id}` : '/api/open-matches';
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const matchTime = new Date(`${values.matchDate}T${values.matchTime}`);

      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: values.courtId,
          matchTime: matchTime.toISOString(),
          playerIds: values.playerIds,
          levelMin: values.levelMin || null,
          levelMax: values.levelMax || null,
        }),
      });

      if (!response.ok) {
        const data = await response.text();
        throw new Error(data || `No se pudo ${isEditMode ? 'actualizar' : 'crear'} la partida.`);
      }

      router.push('/dashboard/partidas-abiertas');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="courtId">Pista</Label>
          <select id="courtId" {...form.register('courtId')} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">Selecciona una pista...</option>
            {courts.map(court => <option key={court.id} value={court.id}>{court.name}</option>)}
          </select>
          {form.formState.errors.courtId && <p className="text-sm text-destructive mt-1">{form.formState.errors.courtId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="playerIds">Jugadores Iniciales</Label>
          <select
            id="playerIds"
            multiple
            {...form.register('playerIds')}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm h-32"
          >
            {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
          </select>
          <p className="text-xs text-muted-foreground">Manten Ctrl (o Cmd) para seleccionar varios.</p>
          {form.formState.errors.playerIds && <p className="text-sm text-destructive">{form.formState.errors.playerIds.message}</p>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="levelMin">Nivel Min. (Opcional)</Label>
          <Input type="number" id="levelMin" {...form.register('levelMin')} step="0.25" placeholder="Ej: 3.0" />
          {form.formState.errors.levelMin && <p className="text-sm text-destructive">{form.formState.errors.levelMin.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="levelMax">Nivel Max. (Opcional)</Label>
          <Input type="number" id="levelMax" {...form.register('levelMax')} step="0.25" placeholder="Ej: 4.5" />
          {form.formState.errors.levelMax && <p className="text-sm text-destructive">{form.formState.errors.levelMax.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="matchDate">Fecha</Label>
          <Input type="date" id="matchDate" {...form.register('matchDate')} />
          {form.formState.errors.matchDate && <p className="text-sm text-destructive">{form.formState.errors.matchDate.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="matchTime">Hora</Label>
          <Input type="time" id="matchTime" {...form.register('matchTime')} />
          {form.formState.errors.matchTime && <p className="text-sm text-destructive">{form.formState.errors.matchTime.message}</p>}
        </div>
      </div>

      {error && <p className="text-sm text-center text-destructive">{error}</p>}

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditMode ? 'Guardar Cambios' : 'Crear Partida'}
        </Button>
      </div>
    </form>
  );
};

export default AddPartidaForm;
