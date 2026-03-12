'use client';

import React, { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface InvitarMiembroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function InvitarMiembroDialog({ open, onOpenChange, onSuccess }: InvitarMiembroDialogProps) {
  const t = useTranslations('team');

  const schema = useMemo(() => z.object({
    email: z.string().email(t('errorGenerico')).max(255),
    role: z.enum(['CLUB_ADMIN', 'STAFF']),
  }), [t]);

  type FormData = z.infer<typeof schema>;

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', role: 'STAFF' },
  });

  const onSubmit = async (values: FormData) => {
    try {
      const res = await fetch('/api/team/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (res.ok) {
        toast({ title: t('invitacionEnviada'), variant: 'success' });
        form.reset();
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: data.error || t('errorGenerico'), variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: t('errorGenerico'), variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('invitarMiembro')}</DialogTitle>
          <DialogDescription>{t('descripcion')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t('email')}</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder={t('emailPlaceholder')}
              {...form.register('email')}
              aria-invalid={!!form.formState.errors.email}
              aria-describedby={form.formState.errors.email ? 'invite-email-error' : undefined}
            />
            {form.formState.errors.email && (
              <p id="invite-email-error" className="text-xs text-destructive" role="alert">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="invite-role">{t('rol')}</Label>
            <Select
              value={form.watch('role')}
              onValueChange={(val) => form.setValue('role', val as 'CLUB_ADMIN' | 'STAFF')}
            >
              <SelectTrigger id="invite-role">
                <SelectValue placeholder={t('seleccionarRol')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CLUB_ADMIN">{t('rolAdmin')}</SelectItem>
                <SelectItem value="STAFF">{t('rolStaff')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('revocarInvitacion') === 'Revocar' ? 'Cancelar' : 'Cancel'}
            </Button>
            <Button type="submit" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t('enviarInvitacion')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
