'use client';

import React, { useState, useMemo } from 'react';
import { User } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { Pencil, Search, ChevronLeft, ChevronRight, Users, UserX, UserCheck } from 'lucide-react';
import { temaMarcadorActivo } from '@/lib/feature-flags';
import Link from 'next/link';
import SocioDetailModal from './SocioDetailModal';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { urlAvatar } from '@/lib/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import EmptyState from '@/components/onboarding/EmptyState';
import { useToast } from '@/hooks/use-toast';

type SocioWithStats = User & {
  _count: {
    bookings: number;
  };
  bookings: { id: string }[];
  membershipId: string;
  membershipStatus: 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'REVOKED';
};

interface SociosClientProps {
  initialSocios: SocioWithStats[];
}

const SociosClient: React.FC<SociosClientProps> = ({ initialSocios }) => {
  const t = useTranslations('socios');
  const tc = useTranslations('common');
  const { toast } = useToast();
  const [socios, setSocios] = useState(initialSocios);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<SocioWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const sociosPerPage = 10;

  const filteredSocios = useMemo(() => {
    return socios.filter(socio => {
      const matchesSearch = socio.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && socio.membershipStatus === 'ACTIVE') ||
        (statusFilter === 'pending' && socio.membershipStatus === 'PENDING') ||
        (statusFilter === 'inactive' && socio.isActive === false);
      return matchesSearch && matchesStatus;
    });
  }, [socios, searchTerm, statusFilter]);

  const currentSocios = useMemo(() => {
    const indexOfLastSocio = currentPage * sociosPerPage;
    const indexOfFirstSocio = indexOfLastSocio - sociosPerPage;
    return filteredSocios.slice(indexOfFirstSocio, indexOfLastSocio);
  }, [filteredSocios, currentPage, sociosPerPage]);

  const totalPages = Math.ceil(filteredSocios.length / sociosPerPage);

  const handleOpenModal = (socio: SocioWithStats) => {
    setSelectedSocio(socio);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSocio(null);
  };

  const actualizarMembresia = async (
    socio: SocioWithStats,
    status: 'ACTIVE' | 'SUSPENDED',
  ) => {
    const response = await fetch(`/api/memberships/${socio.membershipId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      toast({
        title: 'No se pudo actualizar el acceso',
        description: data.error || 'Inténtalo de nuevo.',
        variant: 'destructive',
      });
      return;
    }

    setSocios((actuales) => actuales.map((item) => (
      item.membershipId === socio.membershipId
        ? { ...item, membershipStatus: status, isActive: status === 'ACTIVE' }
        : item
    )));
    toast({
      title: status === 'ACTIVE' ? 'Jugador aprobado' : 'Acceso suspendido',
    });
  };

  if (initialSocios.length === 0 && !searchTerm) {
    return (
      <Card>
        <CardContent className="p-6">
          <EmptyState
            icon={Users}
            title={t('empty')}
            description={t('emptyDesc')}
            actionLabel={t('new')}
            actionHref="/dashboard/socios/nuevo"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <label htmlFor="buscar-socio" className="sr-only">{t('searchLabel')}</label>
          <Input
            id="buscar-socio"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {([
          { key: 'all', label: t('all') },
          { key: 'active', label: t('active') },
          { key: 'pending', label: 'Pendientes' },
          { key: 'inactive', label: t('inactive') },
        ] as const).map(({ key, label }) => (
          <Button
            key={key}
            variant={statusFilter === key ? 'default' : 'outline'}
            size="sm"
            onClick={() => { setStatusFilter(key); setCurrentPage(1); }}
          >
            {label}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-4">
          {currentSocios.length > 0 ? (
            <ul className="space-y-1">
              {currentSocios.map((socio, index) => (
                <React.Fragment key={socio.id}>
                  {index > 0 && <Separator />}
                  <li
                    className={cn(
                      "group flex items-center justify-between py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted",
                      socio.membershipStatus === 'SUSPENDED' && "opacity-50"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenModal(socio)}
                      className="flex items-center gap-4 flex-1 text-left cursor-pointer"
                      aria-label={t('viewDetails', { name: socio.name || '' })}
                    >
                      <Image
                        src={socio.image || urlAvatar(socio.name || 'S')}
                        alt={socio.name || t('memberPhoto')}
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{socio.name}</p>
                        {socio.membershipStatus === 'SUSPENDED' && (
                          // «Marcador» 3c: estado con icono + texto, neutro (no es un error)
                          temaMarcadorActivo() ? (
                            <Badge variant="secondary">
                              <UserX aria-hidden="true" />
                              {t('inactiveBadge')}
                            </Badge>
                          ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                            {t('inactiveBadge')}
                          </Badge>
                          )
                        )}
                        {socio.membershipStatus === 'PENDING' && (
                          <Badge variant="outline">Pendiente de aprobación</Badge>
                        )}
                      </div>
                    </button>
                    {socio.membershipStatus === 'PENDING' && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => actualizarMembresia(socio, 'ACTIVE')}
                      >
                        <UserCheck className="mr-1.5 h-4 w-4" />
                        Aprobar
                      </Button>
                    )}
                    <Link
                      href={`/dashboard/socios/${socio.id}`}
                      className="p-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground rounded-full hover:bg-muted transition-all"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  </li>
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('noResults')}</p>
            </div>
          )}
        </CardContent>

        {totalPages > 1 && (
          <CardFooter className="flex items-center justify-between border-t px-6 py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              {tc('previous')}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t('page', { current: currentPage, total: totalPages })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              {tc('next')}
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </CardFooter>
        )}
      </Card>

      <SocioDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        socio={selectedSocio}
      />
    </>
  );
};

export default SociosClient;
