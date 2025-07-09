'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

const SocioSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("El email no es válido."),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres."),
  phone: z.string().optional(), // Added phone field
});

const AddSocioForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof SocioSchema>>({
    resolver: zodResolver(SocioSchema),
  });

  const onSubmit = async (values: z.infer<typeof SocioSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'No se pudo crear el socio.');
      }
      router.push('/dashboard/socios');
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
        <label htmlFor="name" className="block text-sm font-medium text-gray-300">Nombre Completo</label>
        <input id="name" {...form.register('name')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
        {form.formState.errors.name && <p className="mt-1 text-sm text-red-400">{form.formState.errors.name.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-300">Email</label>
        <input id="email" type="email" {...form.register('email')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
        {form.formState.errors.email && <p className="mt-1 text-sm text-red-400">{form.formState.errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-300">Teléfono (Opcional)</label>
        <input id="phone" type="tel" {...form.register('phone')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
      </div>
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-300">Contraseña Temporal</label>
        <input id="password" type="password" {...form.register('password')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
        {form.formState.errors.password && <p className="mt-1 text-sm text-red-400">{form.formState.errors.password.message}</p>}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      <div className="flex justify-end">
        <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500">
          {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Añadir Socio'}
        </button>
      </div>
    </form>
  );
};

export default AddSocioForm;