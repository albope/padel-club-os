'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Trash2 } from 'lucide-react';
import { Court, User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { BookingWithDetails } from './CalendarView'; // Import the type

// Validation schema
const BookingSchema = z.object({
  courtId: z.string().min(1, "Debes seleccionar una pista."),
  userId: z.string().min(1, "Debes seleccionar un socio."),
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
  const [error, setError] = useState<string | null>(null);

  const isEditMode = selectedInfo !== null && !(selectedInfo instanceof Date);
  const bookingData = isEditMode ? selectedInfo as BookingWithDetails : null;
  const dateData = isEditMode ? new Date(bookingData!.startTime) : selectedInfo as Date;

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(BookingSchema),
    defaultValues: {
      courtId: '',
      userId: '',
    }
  });

  // Pre-fill form if in edit mode
  useEffect(() => {
    if (isEditMode && bookingData) {
      form.reset({
        courtId: bookingData.courtId,
        userId: bookingData.userId,
      });
    } else {
      form.reset({
        courtId: '',
        userId: '',
      });
    }
  }, [bookingData, isEditMode, form]);


  const handleFormSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);
    setError(null);
    
    const url = isEditMode ? `/api/bookings/${bookingData!.id}` : '/api/bookings';
    const method = isEditMode ? 'PATCH' : 'POST';
    const bookingEndTime = new Date(dateData.getTime() + 90 * 60000);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          startTime: dateData.toISOString(),
          endTime: bookingEndTime.toISOString(),
        }),
      });
      if (!response.ok) throw new Error(`No se pudo ${isEditMode ? 'actualizar' : 'crear'} la reserva.`);
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const onDelete = async () => {
    if (!isEditMode || !bookingData) return;
    if (!window.confirm("¿Estás seguro de que quieres eliminar esta reserva?")) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/bookings/${bookingData.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('No se pudo eliminar la reserva.');
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-bold text-white mb-6">{isEditMode ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
        <p className="text-indigo-400 mb-4">{dateData.toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' })}</p>

        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Form fields */}
          <div>
            <label htmlFor="courtId" className="block text-sm font-medium text-gray-300">Pista</label>
            <select id="courtId" {...form.register('courtId')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2">
              <option value="">Selecciona una pista</option>
              {courts.map(court => <option key={court.id} value={court.id}>{court.name}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-300">Socio</label>
            <select id="userId" {...form.register('userId')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2">
              <option value="">Selecciona un socio</option>
              {users.map(user => <option key={user.id} value={user.id}>{user.name}</option>)}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4">
            {isEditMode && (
              <button type="button" onClick={onDelete} disabled={isLoading} className="flex items-center px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg">
                <Trash2 className="mr-2 h-4 w-4" /> Eliminar
              </button>
            )}
            <div className="flex-grow flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-700 rounded-lg hover:bg-gray-600">Cancelar</button>
              <button type="submit" disabled={isLoading} className="flex items-center px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 disabled:bg-gray-500">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEditMode ? 'Guardar Cambios' : 'Confirmar Reserva'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;