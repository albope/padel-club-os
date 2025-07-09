'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { User } from '@prisma/client';

// Validation schema for the new team form
const TeamSchema = z.object({
  name: z.string().min(3, "El nombre del equipo es requerido."),
  player1Id: z.string().min(1, "Debes seleccionar el Jugador 1."),
  player2Id: z.string().min(1, "Debes seleccionar el Jugador 2."),
}).refine(data => data.player1Id !== data.player2Id, {
  message: "Los jugadores no pueden ser los mismos.",
  path: ["player2Id"], // Show error on the second player field
});

type TeamFormValues = z.infer<typeof TeamSchema>;

interface AddTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  leagueId: string;
  users: User[];
}

const AddTeamModal: React.FC<AddTeamModalProps> = ({ isOpen, onClose, leagueId, users }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<TeamFormValues>({
    resolver: zodResolver(TeamSchema),
  });

  if (!isOpen) return null;

  const handleFormSubmit = async (data: TeamFormValues) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/leagues/${leagueId}/teams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo añadir el equipo.');
      }
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-bold text-white mb-6">Añadir Nuevo Equipo</h2>
        
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre del Equipo</label>
            <input id="name" {...form.register('name')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2" />
            {form.formState.errors.name && <p className="mt-1 text-sm text-red-400">{form.formState.errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="player1Id" className="block text-sm font-medium text-gray-300">Jugador 1</label>
            <select id="player1Id" {...form.register('player1Id')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2">
              <option value="">Selecciona un socio</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            {form.formState.errors.player1Id && <p className="mt-1 text-sm text-red-400">{form.formState.errors.player1Id.message}</p>}
          </div>
          <div>
            <label htmlFor="player2Id" className="block text-sm font-medium text-gray-300">Jugador 2</label>
            <select id="player2Id" {...form.register('player2Id')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2">
              <option value="">Selecciona un socio</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
            {form.formState.errors.player2Id && <p className="mt-1 text-sm text-red-400">{form.formState.errors.player2Id.message}</p>}
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <div className="flex justify-end pt-4 gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
            <button type="submit" disabled={isLoading} className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Añadir Equipo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddTeamModal;