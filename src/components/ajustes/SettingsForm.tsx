'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Club } from '@prisma/client';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

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

    try {
      const response = await fetch('/api/club', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error('No se pudieron guardar los ajustes.');
      }

      toast({ title: "Ajustes guardados", description: "Los ajustes se han guardado con éxito." });
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="max-w-lg">
      <CardHeader>
        <CardTitle>Ajustes del Club</CardTitle>
      </CardHeader>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre del Club</Label>
            <Input id="name" {...form.register('name')} />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="openingTime">Hora de Apertura</Label>
              <Input id="openingTime" type="time" {...form.register('openingTime')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="closingTime">Hora de Cierre</Label>
              <Input id="closingTime" type="time" {...form.register('closingTime')} />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Ajustes
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default SettingsForm;
