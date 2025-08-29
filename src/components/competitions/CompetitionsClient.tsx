// Path: src/components/competitions/CompetitionsClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Competition, CompetitionFormat, CompetitionStatus } from '@prisma/client';
import { Trophy, Users, Loader2 } from 'lucide-react';

type CompetitionWithCount = Competition & {
  _count: { teams: number };
};

interface CompetitionsClientProps {
  initialCompetitions: CompetitionWithCount[];
}

const CompetitionsClient: React.FC<CompetitionsClientProps> = ({ initialCompetitions }) => {
  const router = useRouter();
  // Usamos el estado local para que la UI se actualice al instante tras una acción
  const [competitions, setCompetitions] = useState(initialCompetitions);
  const [filter, setFilter] = useState<CompetitionStatus>(CompetitionStatus.ACTIVE);
  const [isLoading, setIsLoading] = useState<string | null>(null); // Guardará el ID de la comp. en carga

  // Sincronizamos el estado si las props iniciales cambian por un router.refresh()
  React.useEffect(() => {
    setCompetitions(initialCompetitions);
  }, [initialCompetitions]);

  const filteredCompetitions = useMemo(() => {
    return competitions.filter(c => c.status === filter);
  }, [competitions, filter]);

  // --- ESTA ES LA LÓGICA QUE AHORA VIVE AQUÍ ---
  const formatToText = (format: CompetitionFormat) => {
    switch (format) {
      case 'LEAGUE': return 'Liga';
      case 'KNOCKOUT': return 'Torneo';
      case 'GROUP_AND_KNOCKOUT': return 'Fase de Grupos';
      default: return 'Competición';
    }
  };
  
  const handleFinish = async (competitionId: string) => {
    if (!window.confirm("¿Seguro que quieres marcar esta competición como finalizada?")) return;
    setIsLoading(competitionId);
    try {
      await fetch(`/api/competitions/${competitionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: CompetitionStatus.FINISHED }),
      });
      // Actualizamos el estado local para que el cambio sea instantáneo
      setCompetitions(prev => prev.map(c => c.id === competitionId ? { ...c, status: CompetitionStatus.FINISHED } : c));
    } catch (error) {
      alert("Error al finalizar la competición.");
    } finally {
      setIsLoading(null);
    }
  };

  const handleDelete = async (competitionId: string) => {
    if (!window.confirm("¡Atención! Vas a eliminar la competición y todos sus datos. Esta acción no se puede deshacer. ¿Continuar?")) return;
    setIsLoading(competitionId);
    try {
      await fetch(`/api/competitions/${competitionId}`, { method: 'DELETE' });
      setCompetitions(prev => prev.filter(c => c.id !== competitionId));
    } catch (error) {
      alert("Error al eliminar la competición.");
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="bg-gray-800 rounded-xl shadow-lg">
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2 bg-gray-900 rounded-lg p-1 w-min">
          <button onClick={() => setFilter(CompetitionStatus.ACTIVE)} className={`px-3 py-1 text-sm font-semibold rounded-md ${filter === 'ACTIVE' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            En curso
          </button>
          <button onClick={() => setFilter(CompetitionStatus.FINISHED)} className={`px-3 py-1 text-sm font-semibold rounded-md ${filter === 'FINISHED' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:bg-gray-700'}`}>
            Finalizadas
          </button>
        </div>
      </div>
      <div className="p-6">
        {filteredCompetitions.length > 0 ? (
          <ul className="divide-y divide-gray-700">
            {filteredCompetitions.map((competition) => (
              <li key={competition.id} className="group flex flex-col sm:flex-row items-start sm:items-center justify-between py-4">
                <Link href={`/dashboard/competitions/${competition.id}`} className="flex-grow">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-gray-700 rounded-lg"><Trophy className="h-6 w-6 text-yellow-400" /></div>
                    <div>
                      <p className="font-semibold text-white group-hover:text-indigo-400">{competition.name}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300">
                          {formatToText(competition.format)}
                        </span>
                        <span className="flex items-center gap-1.5"><Users className="h-4 w-4" /> {competition._count.teams} Equipos</span>
                      </div>
                    </div>
                  </div>
                </Link>
                <div className="flex items-center gap-2 mt-3 sm:mt-0 self-end sm:self-center">
                   {isLoading === competition.id ? (
                      <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                   ) : (
                    <>
                      {filter === 'ACTIVE' && (
                        <button onClick={() => handleFinish(competition.id)} className="px-3 py-1 text-xs font-medium text-green-300 bg-green-500/10 hover:bg-green-500/20 rounded-md">Finalizar</button>
                      )}
                      <button onClick={() => handleDelete(competition.id)} className="px-3 py-1 text-xs font-medium text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md">Eliminar</button>
                    </>
                   )}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400">No hay competiciones en estado "{filter === 'ACTIVE' ? 'En curso' : 'Finalizadas'}".</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitionsClient;