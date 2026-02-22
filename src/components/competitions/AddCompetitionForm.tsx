'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CompetitionFormat } from '@prisma/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const CompetitionSchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres."),
  format: z.nativeEnum(CompetitionFormat),
  rounds: z.coerce.number().int().min(1).max(2).default(1),
  groupSize: z.coerce.number().int().positive().optional(),
  teamsPerGroupToAdvance: z.coerce.number().int().positive().optional(),
});

const AddCompetitionForm = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<z.infer<typeof CompetitionSchema>>({
    resolver: zodResolver(CompetitionSchema),
    defaultValues: {
      name: '',
      format: CompetitionFormat.LEAGUE,
      rounds: 1,
    },
  });

  const selectedFormat = form.watch('format');

  const onSubmit = async (values: z.infer<typeof CompetitionSchema>) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/competitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error('No se pudo crear la competicion.');
      router.push('/dashboard/competitions');
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
        <Label htmlFor="name">Nombre de la Competicion</Label>
        <Input id="name" {...form.register('name')} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="format">Formato</Label>
        <select id="format" {...form.register('format')} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
          <option value={CompetitionFormat.LEAGUE}>Liga (Todos contra todos)</option>
          <option value={CompetitionFormat.KNOCKOUT}>Torneo Eliminatorio</option>
          <option value={CompetitionFormat.GROUP_AND_KNOCKOUT}>Fase de Grupos y Eliminatoria</option>
        </select>
      </div>

      {(selectedFormat === CompetitionFormat.LEAGUE || selectedFormat === CompetitionFormat.GROUP_AND_KNOCKOUT) && (
        <div className="p-4 border border-border rounded-lg space-y-4">
          <div className="space-y-2">
            <Label>
              {selectedFormat === CompetitionFormat.LEAGUE ? "Tipo de Liga" : "Tipo de Fase de Grupos"}
            </Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" {...form.register('rounds')} value="1" className="accent-primary" />
                Solo Ida
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-sm">
                <input type="radio" {...form.register('rounds')} value="2" className="accent-primary" />
                Ida y Vuelta
              </label>
            </div>
          </div>

          {selectedFormat === CompetitionFormat.GROUP_AND_KNOCKOUT && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="space-y-2">
                <Label htmlFor="groupSize">Equipos por Grupo</Label>
                <Input type="number" id="groupSize" {...form.register('groupSize')} defaultValue={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="teamsPerGroupToAdvance">Clasifican por Grupo</Label>
                <Input type="number" id="teamsPerGroupToAdvance" {...form.register('teamsPerGroupToAdvance')} defaultValue={2} />
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}
      <div className="flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Crear Competicion
        </Button>
      </div>
    </form>
  );
};

export default AddCompetitionForm;
