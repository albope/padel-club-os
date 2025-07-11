'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { X, Loader2, Trash2 } from 'lucide-react';
import { Court, User } from '@prisma/client';
import { useRouter } from 'next/navigation';
import { BookingWithDetails } from './CalendarView';

// Validation schema now handles either a userId or a guestName
const BookingSchema = z.object({
  courtId: z.string().min(1, "Debes seleccionar una pista."),
  startDate: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  userId: z.string().optional(),
  guestName: z.string().optional(),
}).refine(data => !!data.userId || (!!data.guestName && data.guestName.length > 0), {
  message: "Debes seleccionar un socio o introducir el nombre de un invitado.",
  path: ["guestName"], // Attach error to the input field
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
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserList, setShowUserList] = useState(false);

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
      // Set the initial search term based on existing data
      setSearchTerm(isEditMode ? bookingData!.user?.name || bookingData!.guestName || '' : '');
    }
  }, [selectedInfo, isEditMode, bookingData, form]);

  const handleFormSubmit = async (data: BookingFormValues) => {
    setIsLoading(true);
    setError(null);
    
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
        const errorText = await response.text();
        throw new Error(errorText || `No se pudo ${isEditMode ? 'actualizar' : 'crear'} la reserva.`);
      }
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
    if (!window.confirm(`¿Estás seguro de que quieres eliminar esta reserva?`)) return;
    setIsLoading(true);
    setError(null);
    try {
      await fetch(`/api/bookings/${bookingData.id}`, { method: 'DELETE' });
      onClose();
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredUsers = searchTerm
    ? users.filter(user => user.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  const selectUser = (user: User) => {
    form.setValue('userId', user.id);
    form.setValue('guestName', ''); // Clear guest name when a user is selected
    setSearchTerm(user.name || '');
    setShowUserList(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-xl shadow-lg p-8 w-full max-w-lg relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X /></button>
        <h2 className="text-2xl font-bold text-white mb-6">{isEditMode ? 'Editar Reserva' : 'Nueva Reserva'}</h2>
        
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
          {/* Date and Time Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-300">Fecha</label>
              <input 
                type="date" 
                id="startDate"
                {...form.register('startDate')}
                className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
              />
            </div>
            <div>
              <label htmlFor="startTime" className="block text-sm font-medium text-gray-300">Hora Inicio</label>
              <input 
                type="time" 
                id="startTime"
                {...form.register('startTime')}
                step="1800" // 30 minute steps
                className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
              />
            </div>
             <div>
              <label htmlFor="endTime" className="block text-sm font-medium text-gray-300">Hora Fin</label>
              <input 
                type="time" 
                id="endTime"
                {...form.register('endTime')}
                step="1800" // 30 minute steps
                className="mt-1 block w-full bg-gray-700 border-gray-600 text-white rounded-md p-2"
              />
            </div>
          </div>
          
          {/* Court Selection */}
          <div>
            <label htmlFor="courtId" className="block text-sm font-medium text-gray-300">Pista</label>
            <select id="courtId" {...form.register('courtId')} className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2">
              <option value="">Selecciona una pista</option>
              {courts.map(court => <option key={court.id} value={court.id}>{court.name}</option>)}
            </select>
          </div>

          {/* --- NEW SEARCHABLE USER/GUEST INPUT --- */}
          <div>
            <label htmlFor="user-search" className="block text-sm font-medium text-gray-300">Socio o Invitado</label>
            <div className="relative">
              <input 
                id="user-search"
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  form.setValue('guestName', e.target.value); // Set as guest name by default
                  form.setValue('userId', ''); // Clear userId when typing
                  setShowUserList(true);
                }}
                onFocus={() => setShowUserList(true)}
                onBlur={() => setTimeout(() => setShowUserList(false), 200)} // Delay to allow click on list
                className="mt-1 block w-full bg-gray-700 text-white rounded-md p-2"
                placeholder="Busca un socio o escribe un nombre..."
                autoComplete="off"
              />
              {showUserList && searchTerm && (
                <ul className="absolute z-10 w-full bg-gray-700 border border-gray-600 rounded-md mt-1 max-h-40 overflow-y-auto">
                  {filteredUsers.length > 0 ? (
                    filteredUsers.map(user => (
                      <li 
                        key={user.id} 
                        onMouseDown={() => selectUser(user)} // Use onMouseDown to fire before onBlur
                        className="px-3 py-2 text-white hover:bg-indigo-600 cursor-pointer"
                      >
                        {user.name}
                      </li>
                    ))
                  ) : (
                    <li className="px-3 py-2 text-gray-400">No se encontraron socios. Pulsa Enter para añadir como invitado.</li>
                  )}
                </ul>
              )}
            </div>
            {form.formState.errors.guestName && <p className="text-sm text-red-400 mt-1">{form.formState.errors.guestName.message}</p>}
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