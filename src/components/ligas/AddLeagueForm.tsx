'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

// Validation schema for the new league form
const LeagueSchema = z.object({
  name: z.string().min(3, "El nombre de la liga debe tener al menos 3 caracteres."),
});

const AddLeagueForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof LeagueSchema>>({
    resolver: zodResolver(LeagueSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof LeagueSchema>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/leagues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('No se pudo crear la liga. Inténtalo de nuevo.');
      }

      // On success, redirect to the leagues list page and refresh the data
      router.push('/dashboard/ligas');
      router.refresh();

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-lg">
      {/* League Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">
          Nombre de la Liga
        </label>
        <input
          id="name"
          type="text"
          {...form.register('name')}
          disabled={isLoading}
          className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md shadow-sm p-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Ej: Liga de Verano 2025"
        />
        {form.formState.errors.name && (
          <p className="mt-1 text-sm text-red-400">{form.formState.errors.name.message}</p>
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
          {isLoading ? 'Guardando...' : 'Crear Liga'}
        </button>
      </div>
    </form>
  );
};

export default AddLeagueForm;