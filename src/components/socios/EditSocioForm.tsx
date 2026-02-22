'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { User } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const SocioSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("El email no es valido."),
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
    defaultValues: {
      name: socio.name || '',
      email: socio.email || '',
      phone: socio.phone || '',
      position: socio.position || '',
      level: socio.level || '',
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
      <div className="space-y-2">
        <Label htmlFor="name">Nombre Completo</Label>
        <Input id="name" {...form.register('name')} disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} disabled={isLoading} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefono (Opcional)</Label>
        <Input id="phone" type="tel" {...form.register('phone')} disabled={isLoading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Posicion de Juego</Label>
          <select id="position" {...form.register('position')} disabled={isLoading} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">No especificada</option>
            <option value="Derecha">Derecha</option>
            <option value="Reves">Reves</option>
            <option value="Indiferente">Indiferente</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Nivel</Label>
          <Input id="level" {...form.register('level')} disabled={isLoading} placeholder="Ej: 3.5, Avanzado..." />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
        <Input id="birthDate" type="date" {...form.register('birthDate')} disabled={isLoading} />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Guardar Cambios
        </Button>
      </div>
    </form>
  );
};

export default EditSocioForm;
