'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Court, User, OpenMatch } from '@prisma/client';

// --- AÑADIDO: La definición del esquema que faltaba ---
const PartidaSchema = z.object({
  courtId: z.string().min(1, "Debes seleccionar una pista."),
  matchDate: z.string().min(1, "La fecha es requerida."),
  matchTime: z.string().min(1, "La hora es requerida."),
  playerIds: z.array(z.string()).min(1, "Debes seleccionar al menos un jugador inicial.").max(4, "No puedes seleccionar más de 4 jugadores."),
  levelMin: z.coerce.number().optional(),
  levelMax: z.coerce.number().optional(),
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
          levelMin: values.levelMin,
          levelMax: values.levelMax,
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="courtId" className="block text-sm font-medium text-gray-300">Pista</label>
          <select id="courtId" {...form.register('courtId')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3">
            <option value="">Selecciona una pista...</option>
            {courts.map(court => <option key={court.id} value={court.id}>{court.name}</option>)}
          </select>
          {form.formState.errors.courtId && <p className="text-sm text-red-400 mt-1">{form.formState.errors.courtId.message}</p>}
        </div>
        <div>
            <label htmlFor="playerIds" className="block text-sm font-medium text-gray-300">Jugadores Iniciales</label>
            <select
                id="playerIds"
                multiple
                {...form.register('playerIds')}
                className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3 h-32"
            >
                {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            <p className="text-xs text-gray-500 mt-1">Mantén Ctrl (o Cmd) para seleccionar varios.</p>
            {form.formState.errors.playerIds && <p className="text-sm text-red-400 mt-1">{form.formState.errors.playerIds.message}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="matchDate" className="block text-sm font-medium text-gray-300">Fecha</label>
            <input type="date" id="matchDate" {...form.register('matchDate')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
            {form.formState.errors.matchDate && <p className="text-sm text-red-400 mt-1">{form.formState.errors.matchDate.message}</p>}
          </div>
          <div>
            <label htmlFor="matchTime" className="block text-sm font-medium text-gray-300">Hora</label>
            <input type="time" id="matchTime" {...form.register('matchTime')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
            {form.formState.errors.matchTime && <p className="text-sm text-red-400 mt-1">{form.formState.errors.matchTime.message}</p>}
          </div>
      </div>
      
      {error && <p className="text-sm text-center text-red-500">{error}</p>}

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          {isEditMode ? 'Guardar Cambios' : 'Crear Partida'}
        </button>
      </div>
    </form>
  );
};

export default AddPartidaForm;