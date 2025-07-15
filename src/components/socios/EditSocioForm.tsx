'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { User } from '@prisma/client';

// --- MODIFICADO ---
const SocioSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("El email no es válido."),
  phone: z.string().optional(),
  position: z.string().optional(),
  level: z.string().optional(),
  birthDate: z.string().optional(),
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
    // --- MODIFICADO ---: Añadimos los valores por defecto de los nuevos campos
    defaultValues: {
      name: socio.name || '',
      email: socio.email || '',
      phone: socio.phone || '',
      position: socio.position || '',
      level: socio.level || '',
      // Formateamos la fecha para el input type="date"
      birthDate: socio.birthDate ? new Date(socio.birthDate).toISOString().split('T')[0] : '',
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

  const onDelete = async () => { /* ... sin cambios ... */ };

  return (
    <form onSubmit={form.handleSubmit(onUpdate)} className="space-y-6 max-w-lg">
        {/* Campos de Nombre, Email, Teléfono (sin cambios) */}
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
        
        {/* --- AÑADIDO: Nuevos campos en el formulario --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-300">Posición de Juego</label>
                <select id="position" {...form.register('position')} disabled={isLoading} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3">
                    <option value="">No especificada</option>
                    <option value="Derecha">Derecha</option>
                    <option value="Revés">Revés</option>
                    <option value="Indiferente">Indiferente</option>
                </select>
            </div>
            <div>
                <label htmlFor="level" className="block text-sm font-medium text-gray-300">Nivel</label>
                <input id="level" {...form.register('level')} disabled={isLoading} placeholder="Ej: 3.5, Avanzado..." className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
            </div>
        </div>
        <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-gray-300">Fecha de Nacimiento</label>
            <input id="birthDate" type="date" {...form.register('birthDate')} disabled={isLoading} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-3" />
        </div>
        
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex justify-between items-center pt-4">
            {/* Botón de Eliminar (sin cambios) */}
            <button type="submit" disabled={isLoading} className="flex items-center justify-center px-6 py-3 font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
                {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Guardar Cambios
            </button>
        </div>
    </form>
  );
};

export default EditSocioForm;