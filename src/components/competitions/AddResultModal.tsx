'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { X, Loader2 } from 'lucide-react';
import { Match } from '@prisma/client';

const ResultSchema = z.object({
  result: z.string().regex(/^\d+-\d+(\s+\d+-\d+)*$/, "Formato inválido. Ejemplo: 6-2 6-4"),
});

interface AddResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match & { team1: { name: string | null }, team2: { name: string | null } };
}

const AddResultModal: React.FC<AddResultModalProps> = ({ isOpen, onClose, match }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  const form = useForm({
    resolver: zodResolver(ResultSchema),
    defaultValues: { result: match.result || '' },
  });

  if (!isOpen) return null;

  const handleFormSubmit = async (data: z.infer<typeof ResultSchema>) => {
    setIsLoading(true);
    try {
      // --- MODIFICADO: La URL ahora usa /api/competitions/ y match.competitionId ---
      const response = await fetch(`/api/competitions/${match.competitionId}/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('No se pudo guardar el resultado.');
      onClose();
      router.refresh();
    } catch (err) {
      alert("Error al guardar el resultado.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-bold text-white mb-2">Añadir Resultado</h2>
        <p className="text-gray-400 mb-6">{match.team1.name} vs {match.team2.name}</p>
        
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <label htmlFor="result" className="block text-sm font-medium text-gray-300">Resultado (Ej: 6-2 6-4)</label>
            <input id="result" {...form.register('result')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2" />
            {form.formState.errors.result && <p className="mt-1 text-sm text-red-400">{form.formState.errors.result.message}</p>}
          </div>
          <div className="flex justify-end pt-4 gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
            <button type="submit" disabled={isLoading} className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-500">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Resultado
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddResultModal;