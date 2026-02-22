'use client';

import React, { useState, useEffect } from 'react';
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
  teamToEdit?: Team | null;
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ isOpen, onClose, competitionId, users, teamToEdit }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isEditMode = !!teamToEdit;

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
        const errorData = await response.json().catch(() => ({ message: 'Error desconocido en el servidor.' }));
        throw new Error(errorData.message || `No se pudo ${isEditMode ? 'actualizar' : 'anadir'} el equipo.`);
      }
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => { /* ...sin cambios... */ };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Equipo' : 'Anadir Nuevo Equipo'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Equipo</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="player1Id">Jugador 1</Label>
            <select id="player1Id" {...form.register('player1Id')} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Selecciona un socio</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            {form.formState.errors.player1Id && <p className="text-sm text-destructive">{form.formState.errors.player1Id.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="player2Id">Jugador 2</Label>
            <select id="player2Id" {...form.register('player2Id')} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Selecciona un socio</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            {form.formState.errors.player2Id && <p className="text-sm text-destructive">{form.formState.errors.player2Id.message}</p>}
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
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
                {isEditMode ? 'Guardar Cambios' : 'Anadir Equipo'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddTeamModal;
