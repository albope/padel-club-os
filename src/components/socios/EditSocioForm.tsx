'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { User } from '@prisma/client';

const SocioSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("El email no es válido."),
  phone: z.string().optional(), // Added phone field
});

interface EditSocioFormProps {
  socio: User;
}

const EditSocioForm: React.FC<EditSocioFormProps> = ({ socio }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof SocioSchema>>({
    resolver: zodResolver(SocioSchema),
    defaultValues: {
      name: socio.name || '',
      email: socio.email || '',
      phone: socio.phone || '', // Pre-fill the phone number
    },
  });

  const onUpdate = async (values: z.infer<typeof SocioSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${socio.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('No se pudo actualizar el socio.');
      router.push('/dashboard/socios');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a "${socio.name}"? Esta acción no se puede deshacer.`)) {
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/users/${socio.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('No se pudo eliminar el socio.');
      router.push('/dashboard/socios');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6 max-w-lg">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre Completo</label>
        <input id="name" {...form.register('name')} disabled={isLoading} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
        <input id="email" type="email" {...form.register('email')} disabled={isLoading} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Teléfono (Opcional)</label>
        <input id="phone" type="tel" {...form.register('phone')} disabled={isLoading} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-between items-center pt-4">
        <button type="button" onClick={onDelete} disabled={isLoading} className="flex items-center px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg">
          <Trash2 className="mr-2 h-4 w-4" />
          Eliminar Socio
        </button>
        <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
          {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
          Guardar Cambios
        </button>
      </div>
    </form>
  );
};

export default EditSocioForm;