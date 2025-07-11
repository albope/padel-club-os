'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Club } from '@prisma/client';

// Validation schema for the settings form
const SettingsSchema = z.object({
  name: z.string().min(3, "El nombre del club es requerido."),
  openingTime: z.string(),
  closingTime: z.string(),
});

interface SettingsFormProps {
  club: Club;
}

const SettingsForm: React.FC<SettingsFormProps> = ({ club }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const form = useForm<z.infer<typeof SettingsSchema>>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      name: club.name || '',
      openingTime: club.openingTime || '09:00',
      closingTime: club.closingTime || '23:00',
    },
  });

  const onSubmit = async (values: z.infer<typeof SettingsSchema>) => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/club', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('No se pudieron guardar los ajustes.');
      }
      
      setSuccess("Ajustes guardados con éxito.");
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre del Club</label>
        <input id="name" {...form.register('name')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="openingTime" className="block text-sm font-medium text-gray-300">Hora de Apertura</label>
          <input id="openingTime" type="time" {...form.register('openingTime')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
        </div>
        <div>
          <label htmlFor="closingTime" className="block text-sm font-medium text-gray-300">Hora de Cierre</label>
          <input id="closingTime" type="time" {...form.register('closingTime')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-green-400">{success}</p>}

      <div className="flex justify-end pt-4">
        <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Guardar Ajustes
        </button>
      </div>
    </form>
  );
};

export default SettingsForm;