'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { Court } from '@prisma/client';

// Validation schema for the court form
const CourtSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  type: z.string().min(1, "Debes seleccionar un tipo de pista."),
});

interface EditCourtFormProps {
  court: Court;
}

const EditCourtForm: React.FC<EditCourtFormProps> = ({ court }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof CourtSchema>>({
    resolver: zodResolver(CourtSchema),
    defaultValues: {
      name: court.name,
      type: court.type,
    },
  });

  const onUpdate = async (values: z.infer<typeof CourtSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/courts/${court.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('No se pudo actualizar la pista.');
      router.push('/dashboard/pistas');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar la pista "${court.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/courts/${court.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('No se pudo eliminar la pista.');
      router.push('/dashboard/pistas');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6 max-w-lg">
      {/* Form fields are similar to the AddCourtForm */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre de la Pista</label>
        <input id="name" type="text" {...form.register('name')} disabled={isLoading} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
        {form.formState.errors.name && <p className="mt-1 text-sm text-red-400">{form.formState.errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-300">Tipo de Pista</label>
        <select id="type" {...form.register('type')} disabled={isLoading} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3">
          <option>Cristal</option>
          <option>Muro</option>
          <option>Individual</option>
        </select>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-between items-center pt-4">
        <button type="button" onClick={onDelete} disabled={isLoading} className="flex items-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar
        </button>
        <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

export default EditCourtForm;