'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Validation schema for the new court form
const CourtSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  type: z.string().min(1, "Debes seleccionar un tipo de pista."),
});

const AddCourtForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof CourtSchema>>({
    resolver: zodResolver(CourtSchema),
    defaultValues: {
      name: '',
      type: 'Cristal', // Default value
    },
  });

  const onSubmit = async (values: z.infer<typeof CourtSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/courts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear la pista. Inténtalo de nuevo.');
      }

      // On success, redirect to the courts list page and refresh the data
      router.push('/dashboard/pistas');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* Court Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Nombre de la Pista
        </label>
        <input
          id="name"
          type="text"
          {...form.register('name')}
          disabled={isLoading}
          className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Ej: Pista Central"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-sm text-red-400">{form.formState.errors.name.message}</p>
        )}
      </div>

      {/* Court Type Field */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-300">
          Tipo de Pista
        </label>
        <select
          id="type"
          {...form.register('type')}
          disabled={isLoading}
          className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
        >
          <option>Cristal</option>
          <option>Muro</option>
          <option>Individual</option>
        </select>
        {form.formState.errors.type && (
          <p className="mt-1 text-sm text-red-400">{form.formState.errors.type.message}</p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg shadow-md hover:bg-indigo-500 transition-colors duration-300 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
          {isLoading ? 'Guardando...' : 'Crear Pista'}
        </button>
      </div>
    </form>
  );
};

export default AddCourtForm;