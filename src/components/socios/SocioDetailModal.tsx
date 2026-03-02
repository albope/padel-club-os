'use client';

import React from 'react';
import { User } from '@prisma/client';
import { Mail, Phone, Gamepad2, BarChart3, Cake, CalendarClock, CalendarCheck2, StickyNote } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type SocioWithStats = User & {
  _count: {
    bookings: number;
  };
  bookings: { id: string }[];
};

interface SocioDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  socio: SocioWithStats | null;
}

const SocioDetailModal: React.FC<SocioDetailModalProps> = ({ isOpen, onClose, socio }) => {
  if (!socio) return null;

  const reservasActivas = socio.bookings.length;
  const reservasTotales = socio._count.bookings;
  const edad = socio.birthDate ? Math.floor((new Date().getTime() - new Date(socio.birthDate).getTime()) / 3.15576e+10) : null;

  const formattedBirthDate = socio.birthDate
    ? `(${(new Date(socio.birthDate).getDate()).toString().padStart(2, '0')}/${(new Date(socio.birthDate).getMonth() + 1).toString().padStart(2, '0')})`
    : '';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <Image
              src={socio.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(socio.name || 'S')}&background=random&color=fff`}
              alt={socio.name || 'Foto de socio'}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full"
            />
            <div>
              <div className="flex items-center gap-2">
                <DialogTitle className="text-2xl">{socio.name}</DialogTitle>
                <DialogDescription className="sr-only">Informacion detallada del socio</DialogDescription>
                <Badge
                  variant="secondary"
                  className={socio.isActive !== false
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                  }
                >
                  {socio.isActive !== false ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">{socio.email}</p>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        <div className="space-y-3 text-sm">
          {socio.phone && (
            <p className="flex items-center gap-3 text-muted-foreground">
              <Phone className="h-5 w-5 text-muted-foreground/60" /> {socio.phone}
            </p>
          )}
          {socio.position && (
            <p className="flex items-center gap-3 text-muted-foreground">
              <Gamepad2 className="h-5 w-5 text-muted-foreground/60" /> {socio.position}
            </p>
          )}
          {socio.level && (
            <p className="flex items-center gap-3 text-muted-foreground">
              <BarChart3 className="h-5 w-5 text-muted-foreground/60" /> Nivel: {socio.level}
            </p>
          )}
          {edad !== null && (
            <p className="flex items-center gap-3 text-muted-foreground">
              <Cake className="h-5 w-5 text-muted-foreground/60" /> {edad} años
              <span className="text-muted-foreground/60 ml-1">{formattedBirthDate}</span>
            </p>
          )}
        </div>

        <Separator />

        <div className="flex justify-around text-center">
          <div>
            <p className="flex items-center justify-center gap-2 font-bold text-2xl text-green-500">
              <CalendarCheck2 className="h-6 w-6" /> {reservasActivas}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Reservas Activas</p>
          </div>
          <div>
            <p className="flex items-center justify-center gap-2 font-bold text-2xl text-primary">
              <CalendarClock className="h-6 w-6" /> {reservasTotales}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Reservas Totales</p>
          </div>
        </div>

        {socio.adminNotes && (
          <>
            <Separator />
            <div className="space-y-1">
              <p className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <StickyNote className="h-3.5 w-3.5" />
                Notas del Admin
              </p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{socio.adminNotes}</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SocioDetailModal;
