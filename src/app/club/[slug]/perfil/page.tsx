'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  User, Mail, Phone, Calendar, MapPin, Loader2,
  LogOut, Save, History, X, ShieldCheck, Download, Trash2, Bell, BellOff,
  CalendarClock,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { calcularPrecioTotal, type BandaPrecio } from '@/lib/pricing-client';
import { useLocale, useTranslations } from 'next-intl';
import BotonCompartir from '@/components/club/BotonCompartir';
import { ValoracionesWidget } from '@/components/social/ValoracionesWidget';

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

interface WaitlistEntry {
  id: string;
  courtId: string;
  courtName: string;
  startTime: string;
  endTime: string;
  status: string;
  createdAt: string;
}

export default function PlayerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const slug = params.slug as string;
  const locale = useLocale();
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB';
  const tShare = useTranslations('share');
  const tw = useTranslations('waitlist');
  const tReschedule = useTranslations('reschedule');

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

  // RGPD - Eliminacion de cuenta
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Lista de espera
  const [waitlistEntries, setWaitlistEntries] = useState<WaitlistEntry[]>([]);
  const [removingWaitlist, setRemovingWaitlist] = useState<string | null>(null);

  // Reagendamiento
  const [rescheduleDialog, setRescheduleDialog] = useState<{
    open: boolean;
    booking: Booking | null;
  }>({ open: false, booking: null });
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState<{
    courtId: string;
    courtName: string;
    startTime: string;
    endTime: string;
    precio: number;
  }[]>([]);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

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
      loadWaitlist();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const loadWaitlist = async () => {
    try {
      const res = await fetch('/api/player/bookings/waitlist');
      if (res.ok) setWaitlistEntries(await res.json());
    } catch { /* silenciar */ }
  };

  const handleRemoveWaitlist = async (id: string) => {
    setRemovingWaitlist(id);
    try {
      const res = await fetch(`/api/player/bookings/waitlist/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setWaitlistEntries((prev) => prev.filter((e) => e.id !== id));
        toast({ title: tw('removed') });
      }
    } catch {
      toast({ title: 'Error', description: tw('error'), variant: 'destructive' });
    } finally {
      setRemovingWaitlist(null);
    }
  };

  const openRescheduleDialog = (booking: Booking) => {
    setRescheduleDialog({ open: true, booking });
    setRescheduleDate('');
    setRescheduleSlots([]);
    setSelectedSlot(null);
  };

  const loadAvailableSlots = async (fecha: string) => {
    setRescheduleDate(fecha);
    setRescheduleSlots([]);
    setSelectedSlot(null);
    if (!fecha) return;

    setRescheduleLoading(true);
    try {
      // Obtener pistas y disponibilidad para esa fecha
      const [pistasRes, dispRes] = await Promise.all([
        fetch(`/api/club/${slug}/courts`),
        fetch(`/api/club/${slug}/availability?date=${fecha}`),
      ]);

      if (!pistasRes.ok || !dispRes.ok) return;

      const pistas: { id: string; name: string }[] = await pistasRes.json();
      const dispData = await dispRes.json();
      const bloques: { courtId: string; inicio: string; fin: string }[] = dispData.bloques || [];

      // Fetch bandas de precio por pista en paralelo
      const bandasPorPista: Record<string, BandaPrecio[]> = {};
      await Promise.all(
        pistas.map(async (pista) => {
          const res = await fetch(`/api/club/${slug}/pricing?courtId=${pista.id}&date=${fecha}`);
          if (res.ok) {
            bandasPorPista[pista.id] = await res.json();
          }
        })
      );

      // Obtener duracion de la reserva original
      const booking = rescheduleDialog.booking;
      if (!booking) return;
      const duracionMs = new Date(booking.endTime).getTime() - new Date(booking.startTime).getTime();
      const duracionMin = duracionMs / 60000;

      // Generar slots disponibles (cada 30 min, de 8:00 a 22:00)
      const slotsDisponibles: typeof rescheduleSlots = [];
      const fechaDate = new Date(fecha + 'T00:00:00');
      const ahora = new Date();

      for (const pista of pistas) {
        for (let hora = 8; hora < 22; hora++) {
          for (const minuto of [0, 30]) {
            const startDate = new Date(fechaDate);
            startDate.setHours(hora, minuto, 0, 0);
            const endDate = new Date(startDate.getTime() + duracionMs);

            // No mostrar horarios pasados
            if (startDate <= ahora) continue;
            // No mostrar si pasa de las 23:00
            if (endDate.getHours() >= 23 && endDate.getMinutes() > 0) continue;

            // Verificar solapamiento con bloques ocupados
            const ocupado = bloques.some(
              (b) =>
                b.courtId === pista.id &&
                new Date(b.inicio) < endDate &&
                new Date(b.fin) > startDate
            );

            if (!ocupado) {
              const horaStr = `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`;
              const precioTotal = calcularPrecioTotal(bandasPorPista[pista.id] ?? [], horaStr, duracionMin);

              slotsDisponibles.push({
                courtId: pista.id,
                courtName: pista.name,
                startTime: startDate.toISOString(),
                endTime: endDate.toISOString(),
                precio: precioTotal ?? 0,
              });
            }
          }
        }
      }

      setRescheduleSlots(slotsDisponibles);
    } catch {
      toast({ title: 'Error', description: tReschedule('errorLoading'), variant: 'destructive' });
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleReschedule = async () => {
    if (selectedSlot === null || !rescheduleDialog.booking) return;
    const slot = rescheduleSlots[selectedSlot];
    if (!slot) return;

    setIsRescheduling(true);
    try {
      const res = await fetch(`/api/player/bookings/${rescheduleDialog.booking.id}/reschedule`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newCourtId: slot.courtId,
          newStartTime: slot.startTime,
          newEndTime: slot.endTime,
        }),
      });

      if (res.ok) {
        toast({ title: tReschedule('success'), description: tReschedule('successDescription'), variant: 'success' });
        setRescheduleDialog({ open: false, booking: null });
        loadBookings();
      } else {
        const data = await res.json();
        toast({ title: 'Error', description: data.error || tReschedule('errorGeneric'), variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: tReschedule('errorConnection'), variant: 'destructive' });
    } finally {
      setIsRescheduling(false);
    }
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
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
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
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsCancelling(false);
      setCancelDialog({ open: false, bookingId: '', descripcion: '' });
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push(`/club/${slug}`);
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const res = await fetch('/api/player/data-export');
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mis-datos-padel-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
        toast({ title: "Exportacion completada", description: "Tus datos se han descargado correctamente.", variant: "success" });
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "No se pudieron exportar tus datos.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'ELIMINAR MIS DATOS') {
      toast({ title: "Error", description: "Debes escribir ELIMINAR MIS DATOS exactamente.", variant: "destructive" });
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch('/api/player/data-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contrasena: deletePassword,
          confirmacion: deleteConfirmation,
        }),
      });

      if (res.ok) {
        toast({ title: "Cuenta eliminada", description: "Tus datos personales han sido eliminados.", variant: "success" });
        await signOut({ redirect: false });
        router.push(`/club/${slug}`);
      } else {
        const data = await res.json();
        toast({ title: "Error", description: data.error || "No se pudo eliminar la cuenta.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Error de conexión.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
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
          Cerrar sesión
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
              <Label htmlFor="phone">Teléfono</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="600 123 456" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="level">Nivel</Label>
              <Input id="level" value={level} onChange={(e) => setLevel(e.target.value)} placeholder="Ej: 3.5" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="position">Posición preferida</Label>
              <Input id="position" value={position} onChange={(e) => setPosition(e.target.value)} placeholder="Derecha / Revés" />
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

      {/* Valoraciones pendientes */}
      <ValoracionesWidget slug={slug} />

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
                          {new Date(booking.startTime).toLocaleDateString(localeCode, {
                            weekday: 'short', day: 'numeric', month: 'short',
                          })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.startTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(booking.endTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {canCancel && (
                        <BotonCompartir
                          datos={{
                            titulo: tShare('bookingTitle'),
                            texto: tShare('bookingText', {
                              court: booking.court.name,
                              date: new Date(booking.startTime).toLocaleDateString(localeCode, { weekday: 'long', day: 'numeric', month: 'long' }),
                              startTime: new Date(booking.startTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' }),
                              endTime: new Date(booking.endTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' }),
                            }),
                            url: typeof window !== 'undefined' ? `${window.location.origin}/club/${slug}/reservar` : '',
                          }}
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          mostrarTexto={false}
                        />
                      )}
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-primary"
                          onClick={() => openRescheduleDialog(booking)}
                          aria-label={tReschedule('button')}
                        >
                          <CalendarClock className="h-4 w-4" />
                        </Button>
                      )}
                      {canCancel && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 px-2"
                          onClick={() => {
                            const fecha = new Date(booking.startTime).toLocaleDateString(localeCode, {
                              weekday: 'long', day: 'numeric', month: 'long',
                            });
                            const hora = new Date(booking.startTime).toLocaleTimeString(localeCode, {
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

      {/* Lista de espera */}
      {waitlistEntries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {tw('myWaitlist')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {waitlistEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{entry.courtName}</Badge>
                      <span className="text-sm font-medium">
                        {new Date(entry.startTime).toLocaleDateString(localeCode, {
                          weekday: 'short', day: 'numeric', month: 'short',
                        })}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(entry.startTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })} -{' '}
                      {new Date(entry.endTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.status === 'notified' ? 'default' : 'outline'}>
                      {entry.status === 'notified' ? tw('statusNotified') : tw('statusActive')}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-muted-foreground hover:text-destructive"
                      onClick={() => handleRemoveWaitlist(entry.id)}
                      disabled={removingWaitlist === entry.id}
                      aria-label={tw('cancel')}
                    >
                      {removingWaitlist === entry.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <X className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seccion RGPD - Datos y privacidad */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Mis datos y privacidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Segun el Reglamento General de Proteccion de Datos (RGPD), tienes
            derecho a exportar y eliminar tus datos personales.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleExportData}
              disabled={isExporting}
            >
              {isExporting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Exportando...</>
              ) : (
                <><Download className="h-4 w-4 mr-2" /> Exportar mis datos</>
              )}
            </Button>
            <Button
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Eliminar mi cuenta
            </Button>
          </div>
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

      {/* Dialog de reagendamiento */}
      <Dialog
        open={rescheduleDialog.open}
        onOpenChange={(open) => {
          setRescheduleDialog((prev) => ({ ...prev, open }));
          if (!open) {
            setRescheduleDate('');
            setRescheduleSlots([]);
            setSelectedSlot(null);
          }
        }}
      >
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{tReschedule('title')}</DialogTitle>
            <DialogDescription>
              {rescheduleDialog.booking && (
                <span className="font-medium text-foreground">
                  {rescheduleDialog.booking.court.name} &middot;{' '}
                  {new Date(rescheduleDialog.booking.startTime).toLocaleDateString(localeCode, {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}{' '}
                  {new Date(rescheduleDialog.booking.startTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })} -{' '}
                  {new Date(rescheduleDialog.booking.endTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="reschedule-date">{tReschedule('newDate')}</Label>
              <Input
                id="reschedule-date"
                type="date"
                value={rescheduleDate}
                onChange={(e) => loadAvailableSlots(e.target.value)}
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>

            {rescheduleLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            )}

            {rescheduleDate && !rescheduleLoading && rescheduleSlots.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                {tReschedule('noSlots')}
              </p>
            )}

            {rescheduleSlots.length > 0 && (
              <div className="space-y-1.5">
                <Label>{tReschedule('selectSlot')}</Label>
                <div className="grid gap-2 max-h-60 overflow-y-auto">
                  {rescheduleSlots.map((slot, idx) => (
                    <button
                      key={`${slot.courtId}-${slot.startTime}`}
                      type="button"
                      onClick={() => setSelectedSlot(idx)}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-lg border text-left transition-colors',
                        selectedSlot === idx
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'hover:bg-muted/50'
                      )}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{slot.courtName}</Badge>
                        </div>
                        <p className="text-sm">
                          {new Date(slot.startTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(slot.endTime).toLocaleTimeString(localeCode, { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      {slot.precio > 0 && (
                        <span className="text-sm font-medium text-muted-foreground">
                          {slot.precio.toFixed(2)} &euro;
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedSlot !== null && (
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setRescheduleDialog({ open: false, booking: null })}
                  disabled={isRescheduling}
                >
                  {tReschedule('cancel')}
                </Button>
                <Button onClick={handleReschedule} disabled={isRescheduling}>
                  {isRescheduling ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> {tReschedule('rescheduling')}</>
                  ) : (
                    tReschedule('confirm')
                  )}
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmacion de eliminacion de cuenta */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={(open) => {
        setDeleteDialogOpen(open);
        if (!open) {
          setDeletePassword('');
          setDeleteConfirmation('');
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar cuenta y datos personales</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>
                  Esta accion es <strong className="text-foreground">irreversible</strong>. Se eliminaran
                  tus datos personales, estadisticas, notificaciones y suscripciones push.
                </p>
                <p>
                  Tu historial de reservas se conservara de forma anonima para la
                  contabilidad del club.
                </p>
                <div className="space-y-2 pt-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="delete-password">Introduce tu contraseña para confirmar</Label>
                    <Input
                      id="delete-password"
                      type="password"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="Tu contraseña actual"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="delete-confirmation">
                      Escribe <span className="font-mono font-semibold">ELIMINAR MIS DATOS</span> para confirmar
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder="ELIMINAR MIS DATOS"
                    />
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== 'ELIMINAR MIS DATOS' || !deletePassword}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Eliminando...</>
              ) : (
                'Eliminar permanentemente'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
