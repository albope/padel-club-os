'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CompetitionFormat } from '@prisma/client';

// --- MODIFICADO: Añadimos los campos opcionales para los grupos ---
const CompetitionSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  format: z.nativeEnum(CompetitionFormat),
  groupSize: z.coerce.number().int().positive().optional(),
  teamsPerGroupToAdvance: z.coerce.number().int().positive().optional(),
});

const AddCompetitionForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof CompetitionSchema>>({
    resolver: zodResolver(CompetitionSchema),
    defaultValues: {
      name: '',
      format: CompetitionFormat.LEAGUE,
    },
  });

  // --- AÑADIDO: Observamos el valor del formato para mostrar/ocultar campos ---
  const selectedFormat = form.watch('format');

  const onSubmit = async (values: z.infer<typeof CompetitionSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('No se pudo crear la competición.');
      router.push('/dashboard/competitions');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre de la Competición</label>
        <input id="name" {...form.register('name')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
      </div>
      <div>
        <label htmlFor="format" className="block text-sm font-medium text-gray-300">Formato</label>
        <select id="format" {...form.register('format')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3">
          <option value={CompetitionFormat.LEAGUE}>Liga (Todos contra todos)</option>
          <option value={CompetitionFormat.KNOCKOUT}>Torneo Eliminatorio</option>
          <option value={CompetitionFormat.GROUP_AND_KNOCKOUT}>Fase de Grupos y Eliminatoria</option>
        </select>
      </div>

      {/* --- AÑADIDO: Campos condicionales --- */}
      {selectedFormat === CompetitionFormat.GROUP_AND_KNOCKOUT && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 border border-gray-700 rounded-lg">
          <div>
            <label htmlFor="groupSize" className="block text-sm font-medium text-gray-300">Equipos por Grupo</label>
            <input type="number" id="groupSize" {...form.register('groupSize')} defaultValue={4} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
          </div>
          <div>
            <label htmlFor="teamsPerGroupToAdvance" className="block text-sm font-medium text-gray-300">Clasifican por Grupo</label>
            <input type="number" id="teamsPerGroupToAdvance" {...form.register('teamsPerGroupToAdvance')} defaultValue={2} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
          </div>
        </div>
      )}

      {/* ... Botón de envío y errores ... */}
      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500">
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Crear Competición
        </button>
      </div>
    </form>
  );
};

export default AddCompetitionForm;