'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Match } from '@prisma/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

const ResultSchema = z.object({
  result: z.string().regex(/^\d+-\d+(\s+\d+-\d+)*$/, "Formato inválido. Ejemplo: 6-2 6-4"),
});

interface AddResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: Match & { team1: { name: string | null } | null, team2: { name: string | null } | null };
}

const AddResultModal: React.FC<AddResultModalProps> = ({ isOpen, onClose, match }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm({
    resolver: zodResolver(ResultSchema),
    defaultValues: { result: match.result || '' },
  });

  const handleFormSubmit = async (data: z.infer<typeof ResultSchema>) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/competitions/${match.competitionId}/matches/${match.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('No se pudo guardar el resultado.');
      toast({ title: "Resultado guardado", description: "El resultado se ha guardado correctamente." });
      onClose();
      router.refresh();
    } catch (err) {
      toast({ title: "Error", description: "Error al guardar el resultado.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Resultado</DialogTitle>
          <DialogDescription>{match.team1?.name ?? 'TBD'} vs {match.team2?.name ?? 'TBD'}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="result">Resultado (Ej: 6-2 6-4)</Label>
            <Input id="result" {...form.register('result')} placeholder="6-2 6-4" />
            {form.formState.errors.result && (
              <p className="text-sm text-destructive">{form.formState.errors.result.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Resultado
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddResultModal;
