'use client';

import React, { useState, useMemo } from 'react';
import { User } from '@prisma/client';
import { Pencil, ShieldCheck, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import SocioDetailModal from './SocioDetailModal';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

type SocioWithStats = User & {
  _count: {
    bookings: number;
  };
  bookings: { id: string }[];
  isAdmin: boolean;
};

interface SociosClientProps {
  initialSocios: SocioWithStats[];
}

const SociosClient: React.FC<SociosClientProps> = ({ initialSocios }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSocio, setSelectedSocio] = useState<SocioWithStats | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const sociosPerPage = 10;

  const filteredSocios = useMemo(() => {
    return initialSocios.filter(socio =>
      socio.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [initialSocios, searchTerm]);

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

  return (
    <>
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar socio por nombre..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-9"
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          {currentSocios.length > 0 ? (
            <ul className="space-y-1">
              {currentSocios.map((socio, index) => (
                <React.Fragment key={socio.id}>
                  {index > 0 && <Separator />}
                  <li
                    onClick={() => handleOpenModal(socio)}
                    className="group flex items-center justify-between py-3 px-2 -mx-2 rounded-lg transition-colors hover:bg-muted cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={socio.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(socio.name || 'S')}&background=random&color=fff`}
                        alt="Avatar"
                        className="h-10 w-10 rounded-full"
                      />
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{socio.name}</p>
                        {socio.isAdmin && (
                          <Badge variant="secondary" className="gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                    </div>
                    {!socio.isAdmin && (
                      <Link
                        href={`/dashboard/socios/${socio.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="p-2 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground rounded-full hover:bg-muted transition-all"
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No se encontraron socios con ese nombre.</p>
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
              Anterior
            </Button>
            <span className="text-sm text-muted-foreground">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Siguiente
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
