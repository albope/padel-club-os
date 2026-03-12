'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

interface CambiarRolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: { id: string; name: string | null; email: string | null; role: string };
  onSuccess: () => void;
}

export default function CambiarRolDialog({ open, onOpenChange, user, onSuccess }: CambiarRolDialogProps) {
  const t = useTranslations('team');
  const [newRole, setNewRole] = useState(user.role);
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSubmit = () => {
    if (newRole === user.role) {
      onOpenChange(false);
      return;
    }
    // Si se baja a PLAYER, confirmar primero
    if (newRole === 'PLAYER') {
      setConfirmOpen(true);
      return;
    }
    doChangeRole();
  };

  const doChangeRole = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/team/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        const msg = newRole === 'PLAYER' ? t('miembroEliminado') : t('rolCambiado');
        toast({ title: msg, variant: 'success' });
        onSuccess();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: 'Error', description: data.error || t('errorGenerico'), variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: t('errorGenerico'), variant: 'destructive' });
    } finally {
      setLoading(false);
      setConfirmOpen(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('cambiarRol')}</DialogTitle>
            <DialogDescription>
              {user.name || user.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="new-role">{t('nuevoRol')}</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger id="new-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLUB_ADMIN">{t('rolAdmin')}</SelectItem>
                  <SelectItem value="STAFF">{t('rolStaff')}</SelectItem>
                  <SelectItem value="PLAYER">{t('rolJugador')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={loading || newRole === user.role}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('confirmarCambiarRol')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('confirmarEliminar')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('confirmarEliminarDesc')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={doChangeRole} disabled={loading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {t('confirmarEliminar')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
