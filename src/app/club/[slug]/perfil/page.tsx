'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  User, Mail, Phone, Calendar, MapPin, Loader2,
  LogOut, Save, History, X, ShieldCheck, Download, Trash2,
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

  // RGPD - Eliminacion de cuenta
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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
