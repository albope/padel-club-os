'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  User, Mail, Phone, Calendar, MapPin, Loader2,
  LogOut, Save, History, X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  position: string | null;
  level: string | null;
  birthDate: string | null;
  image: string | null;
}

interface Booking {
  id: string;
  startTime: string;
  endTime: string;
  status: string;
  court: { name: string; type: string };
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params.slug as string;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [cancelDialog, setCancelDialog] = useState<{
    open: boolean;
    bookingId: string;
    descripcion: string;
  }>({ open: false, bookingId: '', descripcion: '' });
  const [isCancelling, setIsCancelling] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [position, setPosition] = useState('');
  const [level, setLevel] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/club/${slug}/login`);
      return;
    }
    if (status === 'authenticated') {
      loadProfile();
      loadBookings();
    }
  }, [status]);

  const loadProfile = async () => {
    try {
      const res = await fetch('/api/player/profile');
      if (res.ok) {
        const data = await res.json();
        setProfile(data);
        setName(data.name || '');
        setPhone(data.phone || '');
        setPosition(data.position || '');
        setLevel(data.level || '');
      }
    } catch { /* silenciar */ }
    finally { setIsLoading(false); }
  };

  const loadBookings = async () => {
    try {
      const res = await fetch('/api/player/bookings');
      if (res.ok) setBookings(await res.json());
    } catch { /* silenciar */ }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/player/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, position, level }),
      });

      if (res.ok) {
        toast({ title: "Perfil actualizado", description: "Tus datos se han guardado correctamente." });
        loadProfile();
      } else {
        toast({ title: "Error", description: "No se pudo actualizar el perfil.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexion.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelBooking = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/player/bookings?bookingId=${cancelDialog.bookingId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        toast({ title: "Reserva cancelada", description: "Tu reserva ha sido cancelada correctamente." });
        loadBookings();
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "No se pudo cancelar la reserva.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexion.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
      setCancelDialog({ open: false, bookingId: '', descripcion: '' });
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push(`/club/${slug}`);
  };

  if (isLoading || status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mi perfil</h1>
          <p className="text-muted-foreground">Gestiona tus datos personales</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Cerrar sesion
        </Button>
      </div>

      {/* Datos del perfil */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5" />
            Datos personales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={profile?.email || ''} disabled className="bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 123 456" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">Nivel</Label>
              <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Ej: 3.5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Posicion preferida</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Derecha / Reves" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Guardando...</>
              ) : (
                <><Save className="h-4 w-4 mr-2" /> Guardar cambios</>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historial de reservas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <History className="h-5 w-5" />
            Mis reservas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tienes reservas.</p>
          ) : (
            <div className="space-y-2">
              {bookings.slice(0, 20).map((booking) => {
                const isPast = new Date(booking.startTime) < new Date();
                const isCancelled = booking.status === 'cancelled';
                const canCancel = !isPast && booking.status === 'confirmed';

                return (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-3 rounded-lg border"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{booking.court.name}</Badge>
                        <span className="text-sm font-medium">
                          {new Date(booking.startTime).toLocaleDateString('es-ES', {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.startTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(booking.endTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                          onClick={() => {
                            const fecha = new Date(booking.startTime).toLocaleDateString('es-ES', {
                              weekday: 'long', day: 'numeric', month: 'long',
                            });
                            const hora = new Date(booking.startTime).toLocaleTimeString('es-ES', {
                              hour: '2-digit', minute: '2-digit',
                            });
                            setCancelDialog({
                              open: true,
                              bookingId: booking.id,
                              descripcion: `${booking.court.name} · ${fecha} a las ${hora}`,
                            });
                          }}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Badge variant={
                        isCancelled ? 'destructive' :
                        isPast ? 'outline' :
                        booking.status === 'confirmed' ? 'default' : 'secondary'
                      }>
                        {isCancelled ? 'Cancelada' : isPast ? 'Pasada' : booking.status === 'confirmed' ? 'Confirmada' : booking.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de confirmacion de cancelacion */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => setCancelDialog((prev) => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar reserva</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que quieres cancelar esta reserva?
              <br />
              <span className="font-medium text-foreground">{cancelDialog.descripcion}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>Volver</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelBooking}
              disabled={isCancelling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCancelling ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Cancelando...</>
              ) : (
                'Cancelar reserva'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
