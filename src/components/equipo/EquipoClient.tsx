'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { UserCog, Mail, MoreHorizontal, Send, Trash2, RefreshCw, ArrowUpDown, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from '@/hooks/use-toast';
import InvitarMiembroDialog from './InvitarMiembroDialog';
import CambiarRolDialog from './CambiarRolDialog';

interface TeamMember {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
}

interface TeamInvitation {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  expires: string;
  invitedBy: { name: string | null };
}

interface TeamData {
  members: TeamMember[];
  invitations: TeamInvitation[];
  limits: { used: number; limit: number };
  currentUserId: string;
}

export default function EquipoClient() {
  const t = useTranslations('team');
  const [data, setData] = useState<TeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleDialog, setRoleDialog] = useState<{ open: boolean; user: TeamMember | null }>({ open: false, user: null });
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    try {
      const res = await fetch('/api/team');
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleRevoke = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/team/invite/${invitationId}`, { method: 'DELETE' });
      if (res.ok) {
        toast({ title: t('invitacionRevocada'), variant: 'success' });
        fetchTeam();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.error || t('errorGenerico'), variant: 'destructive' });
      }
    } catch {
      toast({ title: "Error", description: t('errorGenerico'), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const handleResend = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const res = await fetch(`/api/team/invite/${invitationId}/resend`, { method: 'POST' });
      if (res.ok) {
        toast({ title: t('invitacionReenviada'), variant: 'success' });
        fetchTeam();
      } else {
        const err = await res.json().catch(() => ({}));
        toast({ title: "Error", description: err.error || t('errorGenerico'), variant: 'destructive' });
      }
    } catch {
      toast({ title: "Error", description: t('errorGenerico'), variant: 'destructive' });
    } finally {
      setActionLoading(null);
    }
  };

  const roleBadge = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Super Admin</Badge>;
      case 'CLUB_ADMIN':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">{t('rolAdmin')}</Badge>;
      case 'STAFF':
        return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">{t('rolStaff')}</Badge>;
      default:
        return <Badge variant="secondary">{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data) return null;

  const limitText = data.limits.limit === -1
    ? t('limiteIlimitado')
    : t('limiteIndicador', { used: data.limits.used, limit: data.limits.limit });

  const canInvite = data.limits.limit === -1 || data.limits.used < data.limits.limit;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <UserCog className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{limitText}</span>
            </div>
            <Button onClick={() => setInviteOpen(true)} disabled={!canInvite}>
              <Mail className="h-4 w-4" />
              {t('invitarMiembro')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="members">
            <TabsList>
              <TabsTrigger value="members">{t('miembros')}</TabsTrigger>
              <TabsTrigger value="invitations">
                {t('invitaciones')}
                {data.invitations.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] px-1.5">
                    {data.invitations.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="members" className="mt-4">
              {data.members.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t('sinMiembros')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('miembros')}</TableHead>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead>{t('rol')}</TableHead>
                      <TableHead className="w-[80px]">{t('acciones')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.members.map((member) => {
                      const isCurrentUser = member.id === data.currentUserId;
                      const isSuperAdmin = member.role === 'SUPER_ADMIN';

                      return (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {member.name || '-'}
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-xs">{t('tuCuenta')}</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{member.email}</TableCell>
                          <TableCell>{roleBadge(member.role)}</TableCell>
                          <TableCell>
                            {!isCurrentUser && !isSuperAdmin && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" aria-label={t('acciones')}>
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem onClick={() => setRoleDialog({ open: true, user: member })}>
                                    <ArrowUpDown className="h-4 w-4 mr-2" />
                                    {t('cambiarRol')}
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </TabsContent>

            <TabsContent value="invitations" className="mt-4">
              {data.invitations.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{t('sinInvitaciones')}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t('email')}</TableHead>
                      <TableHead>{t('rol')}</TableHead>
                      <TableHead>{t('enviadaPor')}</TableHead>
                      <TableHead>{t('expiraEl')}</TableHead>
                      <TableHead className="w-[100px]">{t('acciones')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.invitations.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell className="font-medium">{inv.email}</TableCell>
                        <TableCell>{roleBadge(inv.role)}</TableCell>
                        <TableCell className="text-muted-foreground">{inv.invitedBy?.name || '-'}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(inv.expires).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResend(inv.id)}
                              disabled={actionLoading === inv.id}
                              aria-label={t('reenviarInvitacion')}
                            >
                              {actionLoading === inv.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRevoke(inv.id)}
                              disabled={actionLoading === inv.id}
                              aria-label={t('revocarInvitacion')}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <InvitarMiembroDialog
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        onSuccess={() => { setInviteOpen(false); fetchTeam(); }}
      />

      {roleDialog.user && (
        <CambiarRolDialog
          open={roleDialog.open}
          onOpenChange={(open) => setRoleDialog({ ...roleDialog, open })}
          user={roleDialog.user}
          onSuccess={() => { setRoleDialog({ open: false, user: null }); fetchTeam(); }}
        />
      )}
    </>
  );
}
