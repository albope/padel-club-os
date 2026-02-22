'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const SocioSchema = z.object({
  name: z.string().min(3, "El nombre es requerido."),
  email: z.string().email("El email no es valido."),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres."),
  phone: z.string().optional(),
  position: z.string().optional(),
  level: z.string().optional(),
  birthDate: z.string().optional(),
});

const AddSocioForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof SocioSchema>>({
    resolver: zodResolver(SocioSchema),
    defaultValues: {
      name: '', email: '', password: '', phone: '', position: '', level: '', birthDate: ''
    }
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
      <div className="space-y-2">
        <Label htmlFor="name">Nombre Completo</Label>
        <Input id="name" {...form.register('name')} />
        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register('email')} />
        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="phone">Telefono (Opcional)</Label>
        <Input id="phone" type="tel" {...form.register('phone')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position">Posicion de Juego</Label>
          <select id="position" {...form.register('position')} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
            <option value="">No especificada</option>
            <option value="Derecha">Derecha</option>
            <option value="Reves">Reves</option>
            <option value="Indiferente">Indiferente</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="level">Nivel</Label>
          <Input id="level" {...form.register('level')} placeholder="Ej: 3.5, Avanzado..." />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="birthDate">Fecha de Nacimiento</Label>
        <Input id="birthDate" type="date" {...form.register('birthDate')} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contrasena Temporal</Label>
        <Input id="password" type="password" {...form.register('password')} />
        {form.formState.errors.password && <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Anadir Socio
        </Button>
      </div>
    </form>
  );
};

export default AddSocioForm;
