'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { Court, User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { BookingWithDetails } from './CalendarView';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

const BookingSchema = z.object({
  courtId: z.string().min(1, "Debes seleccionar una pista."),
  startDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  userId: z.string().optional(),
  guestName: z.string().optional(),
}).refine(data => data.startTime < data.endTime, {
  message: "La hora de fin debe ser posterior a la de inicio.",
  path: ["endTime"],
}).refine(data => !!data.userId || (!!data.guestName && data.guestName.length > 0), {
  message: "Debes seleccionar un socio o introducir el nombre de un invitado.",
  path: ["guestName"],
});

type BookingFormValues = z.infer<typeof BookingSchema>;

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInfo: Date | BookingWithDetails | null;
  courts: Court[];
  users: User[];
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, selectedInfo, courts, users }) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isEditMode = selectedInfo !== null && !(selectedInfo instanceof Date);
  const bookingData = isEditMode ? selectedInfo as BookingWithDetails : null;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingSchema),
  });

  useEffect(() => {
    if (selectedInfo) {
      const initialDate = isEditMode ? new Date(bookingData!.startTime) : selectedInfo as Date;
      const endDate = isEditMode ? new Date(bookingData!.endTime) : new Date(initialDate.getTime() + 90 * 60000);
      form.reset({
        courtId: isEditMode ? bookingData!.courtId : '',
        userId: isEditMode ? bookingData!.userId || '' : '',
        guestName: isEditMode ? bookingData!.guestName || '' : '',
        startDate: initialDate.toISOString().split('T')[0],
        startTime: initialDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
      });
      setSearchTerm(isEditMode ? bookingData!.user?.name || bookingData!.guestName || '' : '');
    }
  }, [selectedInfo, isEditMode, bookingData, form]);

  const handleFormSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);

    const newStartTime = new Date(`${data.startDate}T${data.startTime}`);
    const newEndTime = new Date(`${data.startDate}T${data.endTime}`);

    const url = isEditMode ? `/api/bookings/${bookingData!.id}` : '/api/bookings';
    const method = isEditMode ? 'PATCH' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courtId: data.courtId,
          userId: data.userId,
          guestName: data.guestName,
          startTime: newStartTime.toISOString(),
          endTime: newEndTime.toISOString(),
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          const errorMessage = await response.text();
          throw new Error(errorMessage);
        }
        throw new Error(`No se pudo ${isEditMode ? 'actualizar' : 'crear'} la reserva.`);
      }
      toast({ title: isEditMode ? "Reserva actualizada" : "Reserva creada", description: `La reserva se ha ${isEditMode ? 'actualizado' : 'creado'} correctamente.` });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!isEditMode || !bookingData) return;
    setDeleteDialogOpen(false);
    setIsLoading(true);
    try {
      await fetch(`/api/bookings/${bookingData!.id}`, { method: 'DELETE' });
      toast({ title: "Reserva eliminada", description: "La reserva ha sido eliminada." });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const selectUser = (user: User) => {
    form.setValue('userId', user.id);
    form.setValue('guestName', '');
    setSearchTerm(user.name || '');
    setShowUserList(false);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Editar Reserva' : 'Nueva Reserva'}</DialogTitle>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="startDate">Fecha</Label>
                <Input type="date" id="startDate" {...form.register('startDate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">Hora Inicio</Label>
                <Input type="time" id="startTime" {...form.register('startTime')} step="1800" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">Hora Fin</Label>
                <Input type="time" id="endTime" {...form.register('endTime')} step="1800" />
              </div>
            </div>
            {form.formState.errors.endTime && (
              <p className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="courtId">Pista</Label>
              <Select
                value={form.watch('courtId')}
                onValueChange={(value) => form.setValue('courtId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una pista" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(courts) && courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.courtId && (
                <p className="text-sm text-destructive">{form.formState.errors.courtId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-search">Socio o Invitado</Label>
              <div className="relative">
                <Input
                  id="user-search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    form.setValue('guestName', e.target.value);
                    form.setValue('userId', '');
                    setShowUserList(true);
                  }}
                  onFocus={() => setShowUserList(true)}
                  onBlur={() => setTimeout(() => setShowUserList(false), 200)}
                  placeholder="Busca un socio o escribe un nombre..."
                  autoComplete="off"
                />
                {showUserList && searchTerm && (
                  <ul className="absolute z-10 w-full bg-popover border border-border rounded-md mt-1 max-h-40 overflow-y-auto shadow-md">
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map(user => (
                        <li key={user.id} onMouseDown={() => selectUser(user)} className="px-3 py-2 text-popover-foreground hover:bg-accent cursor-pointer">
                          {user.name}
                        </li>
                      ))
                    ) : (
                      <li className="px-3 py-2 text-muted-foreground">No se encontraron socios. Pulsa Enter para añadir como invitado.</li>
                    )}
                  </ul>
                )}
              </div>
              {form.formState.errors.guestName && (
                <p className="text-sm text-destructive">{form.formState.errors.guestName.message}</p>
              )}
            </div>

            <div className="flex justify-between items-center pt-2">
              {isEditMode && (
                <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isLoading}>
                  <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </Button>
              )}
              <div className="flex-grow flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? 'Guardar Cambios' : 'Confirmar Reserva'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que quieres eliminar esta reserva? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingModal;
