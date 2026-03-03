'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Trash2 } from 'lucide-react';
import { Court, User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { BookingWithDetails } from './CalendarView';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

// Generar opciones de hora cada 30 minutos (07:00 - 23:30)
const HORAS_DISPONIBLES = Array.from({ length: 34 }, (_, i) => {
  const totalMinutes = 7 * 60 + i * 30; // Desde las 07:00
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
});

function redondearA30Min(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  const rounded = m < 15 ? 0 : m < 45 ? 30 : 60;
  const totalMin = h * 60 + rounded;
  const hh = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const mm = (totalMin % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

function calcularHoraFin(startTime: string): string {
  const [h, m] = startTime.split(':').map(Number);
  const totalMin = h * 60 + m + 90; // +1h30m
  const hh = Math.floor(totalMin / 60).toString().padStart(2, '0');
  const mm = (totalMin % 60).toString().padStart(2, '0');
  return `${hh}:${mm}`;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedInfo: Date | BookingWithDetails | null;
  courts: Court[];
  users: User[];
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, selectedInfo, courts, users }) => {
  const router = useRouter();
  const t = useTranslations('booking');
  const tc = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const isEditMode = selectedInfo !== null && !(selectedInfo instanceof Date);
  const bookingData = isEditMode ? selectedInfo as BookingWithDetails : null;

  const BookingSchema = useMemo(() => z.object({
    courtId: z.string().min(1, t('courtRequired')),
    startDate: z.string(),
    startTime: z.string(),
    endTime: z.string(),
    userId: z.string().optional(),
    guestName: z.string().optional(),
    numPlayers: z.number().int().min(2).max(4).optional(),
  }).refine(data => data.startTime < data.endTime, {
    message: t('endAfterStart'),
    path: ["endTime"],
  }).refine(data => !!data.userId || (!!data.guestName && data.guestName.length > 0), {
    message: t('memberRequired'),
    path: ["guestName"],
  }), [t]);

  type BookingFormValues = z.infer<typeof BookingSchema>;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingSchema),
  });

  useEffect(() => {
    if (selectedInfo) {
      const initialDate = isEditMode ? new Date(bookingData!.startTime) : selectedInfo as Date;
      const startTime = isEditMode
        ? redondearA30Min(new Date(bookingData!.startTime))
        : redondearA30Min(initialDate);
      const endTime = isEditMode
        ? redondearA30Min(new Date(bookingData!.endTime))
        : calcularHoraFin(startTime);
      form.reset({
        courtId: isEditMode ? bookingData!.courtId : '',
        userId: isEditMode ? bookingData!.userId || '' : '',
        guestName: isEditMode ? bookingData!.guestName || '' : '',
        startDate: initialDate.toISOString().split('T')[0],
        startTime,
        endTime,
        numPlayers: (isEditMode && bookingData!.numPlayers) ? bookingData!.numPlayers : 4,
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

    const actionKey = isEditMode ? 'bookingUpdated' : 'bookingCreated';

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
          numPlayers: data.numPlayers || 4,
        }),
      });
      if (!response.ok) {
        if (response.status === 409) {
          const errorMessage = await response.text();
          throw new Error(errorMessage);
        }
        throw new Error(t('bookingError', { action: t(actionKey) }));
      }
      toast({ title: isEditMode ? t('editBooking') : t('newBooking'), description: t('bookingSuccess', { action: t(actionKey) }) });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: tc('error'), description: err.message, variant: "destructive" });
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
      toast({ title: t('deleteBooking'), description: t('bookingSuccess', { action: t('bookingDeleted') }) });
      onClose();
      router.refresh();
    } catch (err: any) {
      toast({ title: tc('error'), description: err.message, variant: "destructive" });
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
            <DialogTitle>{isEditMode ? t('editBooking') : t('newBooking')}</DialogTitle>
            <DialogDescription>{t('newBookingDesc')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-1 space-y-2">
                <Label htmlFor="startDate">{t('date')}</Label>
                <Input type="date" id="startDate" {...form.register('startDate')} aria-required="true" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="startTime">{t('startTime')}</Label>
                <Select
                  value={form.watch('startTime')}
                  onValueChange={(value) => {
                    form.setValue('startTime', value);
                    form.setValue('endTime', calcularHoraFin(value));
                  }}
                >
                  <SelectTrigger id="startTime">
                    <SelectValue placeholder={t('startTimePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {HORAS_DISPONIBLES.map(hora => (
                      <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">{t('endTime')}</Label>
                <Select
                  value={form.watch('endTime')}
                  onValueChange={(value) => form.setValue('endTime', value)}
                >
                  <SelectTrigger id="endTime">
                    <SelectValue placeholder={t('endTimePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {HORAS_DISPONIBLES.map(hora => (
                      <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.formState.errors.endTime && (
              <p id="endTime-error" role="alert" className="text-sm text-destructive">{form.formState.errors.endTime.message}</p>
            )}

            <div className="space-y-2">
              <Label htmlFor="courtId">{t('court')}</Label>
              <Select
                value={form.watch('courtId')}
                onValueChange={(value) => form.setValue('courtId', value)}
              >
                <SelectTrigger id="courtId">
                  <SelectValue placeholder={t('selectCourt')} />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(courts) && courts.map(court => (
                    <SelectItem key={court.id} value={court.id}>{court.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.courtId && (
                <p id="courtId-error" role="alert" className="text-sm text-destructive">{form.formState.errors.courtId.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-search">{t('memberOrGuest')}</Label>
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
                  placeholder={t('searchMember')}
                  autoComplete="off"
                  aria-required="true"
                  aria-invalid={!!form.formState.errors.guestName}
                  aria-describedby={form.formState.errors.guestName ? "guestName-error" : undefined}
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
                      <li className="px-3 py-2 text-muted-foreground">{t('noMembersFound')}</li>
                    )}
                  </ul>
                )}
              </div>
              {form.formState.errors.guestName && (
                <p id="guestName-error" role="alert" className="text-sm text-destructive">{form.formState.errors.guestName.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="numPlayers">{t('numPlayers')}</Label>
              <Select
                value={String(form.watch('numPlayers') || 4)}
                onValueChange={(value) => form.setValue('numPlayers', Number(value))}
              >
                <SelectTrigger id="numPlayers">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 jugadores</SelectItem>
                  <SelectItem value="3">3 jugadores</SelectItem>
                  <SelectItem value="4">4 jugadores</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between items-center pt-2">
              {isEditMode && (
                <Button type="button" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => setDeleteDialogOpen(true)} disabled={isLoading}>
                  <Trash2 className="mr-2 h-4 w-4" /> {tc('delete')}
                </Button>
              )}
              <div className="flex-grow flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={onClose}>{tc('cancel')}</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditMode ? t('saveChanges') : t('confirmBookingBtn')}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteBooking')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('deleteBookingConfirm')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {tc('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BookingModal;
