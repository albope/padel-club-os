'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { User, Team } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

const TeamSchema = z.object({
  name: z.string().min(3, "El nombre del equipo es requerido."),
  player1Id: z.string().min(1, "Debes seleccionar el Jugador 1."),
  player2Id: z.string().min(1, "Debes seleccionar el Jugador 2."),
}).refine(data => data.player1Id !== data.player2Id, {
  message: "Los jugadores no pueden ser los mismos.",
  path: ["player2Id"],
});

type TeamFormValues = z.infer<typeof TeamSchema>;

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  competitionId: string;
  users: User[];
  teams: Team[];
  teamToEdit?: Team | null;
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ isOpen, onClose, competitionId, users, teams, teamToEdit }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!teamToEdit;

  const equipoPorJugador = useMemo(() => {
    const resultado = new Map<string, string>();
    for (const team of teams) {
      if (team.id === teamToEdit?.id) continue;
      resultado.set(team.player1Id, team.name);
      resultado.set(team.player2Id, team.name);
    }
    return resultado;
  }, [teams, teamToEdit?.id]);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(TeamSchema),
    defaultValues: { name: '', player1Id: '', player2Id: '' }
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && teamToEdit) {
        form.reset({
          name: teamToEdit.name,
          player1Id: teamToEdit.player1Id,
          player2Id: teamToEdit.player2Id,
        });
      } else {
        form.reset({ name: '', player1Id: '', player2Id: '' });
      }
    }
  }, [isOpen, isEditMode, teamToEdit, form]);

  const handleFormSubmit = async (data: TeamFormValues) => {
    setIsLoading(true);
    setError(null);

    const url = isEditMode
      ? `/api/competitions/${competitionId}/teams/${teamToEdit!.id}`
      : `/api/competitions/${competitionId}/teams`;
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null) as {
          error?: unknown;
          message?: unknown;
        } | null;
        const mensajeServidor = typeof errorData?.error === 'string'
          ? errorData.error
          : typeof errorData?.message === 'string'
            ? errorData.message
            : null;
        throw new Error(mensajeServidor || `No se pudo ${isEditMode ? 'actualizar' : 'añadir'} el equipo.`);
      }
      onClose();
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el equipo.');
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => { /* ...sin cambios... */ };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Equipo' : 'Añadir Nuevo Equipo'}</DialogTitle>
          <DialogDescription>Introduce el nombre del equipo y selecciona los dos jugadores.</DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Equipo</Label>
            <Input
              id="name"
              {...form.register('name')}
              aria-required="true"
              aria-invalid={!!form.formState.errors.name}
              aria-describedby={form.formState.errors.name ? "name-error" : undefined}
            />
            {form.formState.errors.name && <p id="name-error" role="alert" className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="player1Id">Jugador 1</Label>
            <select
              id="player1Id"
              {...form.register('player1Id')}
              aria-required="true"
              aria-invalid={!!form.formState.errors.player1Id}
              aria-describedby={form.formState.errors.player1Id ? "player1Id-error" : undefined}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecciona un socio</option>
              {users.map(user => {
                const equipoInscrito = equipoPorJugador.get(user.id);
                return (
                  <option key={user.id} value={user.id} disabled={!!equipoInscrito}>
                    {user.name}{equipoInscrito ? ` — Ya inscrito en ${equipoInscrito}` : ''}
                  </option>
                );
              })}
            </select>
            {form.formState.errors.player1Id && <p id="player1Id-error" role="alert" className="text-sm text-destructive">{form.formState.errors.player1Id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="player2Id">Jugador 2</Label>
            <select
              id="player2Id"
              {...form.register('player2Id')}
              aria-required="true"
              aria-invalid={!!form.formState.errors.player2Id}
              aria-describedby={form.formState.errors.player2Id ? "player2Id-error" : undefined}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Selecciona un socio</option>
              {users.map(user => {
                const equipoInscrito = equipoPorJugador.get(user.id);
                return (
                  <option key={user.id} value={user.id} disabled={!!equipoInscrito}>
                    {user.name}{equipoInscrito ? ` — Ya inscrito en ${equipoInscrito}` : ''}
                  </option>
                );
              })}
            </select>
            {form.formState.errors.player2Id && <p id="player2Id-error" role="alert" className="text-sm text-destructive">{form.formState.errors.player2Id.message}</p>}
          </div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          <DialogFooter className="flex justify-between items-center pt-4">
            {isEditMode && (
              <Button type="button" variant="ghost" onClick={onDelete} disabled={isLoading} className="text-destructive hover:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </Button>
            )}
            <div className="flex-grow flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Guardar Cambios' : 'Añadir Equipo'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamModal;
