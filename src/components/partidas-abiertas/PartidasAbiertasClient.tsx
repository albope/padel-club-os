'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OpenMatch, Court } from '@prisma/client';
import { Calendar, Clock, MapPin, Users, ShieldCheck, Hourglass, XCircle, Pencil, Loader2 } from 'lucide-react';
import Link from 'next/link';

type MatchWithDetails = OpenMatch & {
  court: { name: string };
  players: { user: { id: string; name: string | null } }[];
};

interface PartidasAbiertasClientProps {
  initialMatches: MatchWithDetails[];
}

// --- FUNCIÓN CORREGIDA ---
const getStatusInfo = (status: MatchWithDetails['status']) => {
    switch (status) {
        case 'OPEN':
            return { text: 'Abierta', color: 'text-blue-400 bg-blue-500/10', icon: Hourglass };
        case 'FULL':
            return { text: 'Completa', color: 'text-yellow-400 bg-yellow-500/10', icon: Users };
        case 'CONFIRMED':
            return { text: 'Confirmada', color: 'text-green-400 bg-green-500/10', icon: ShieldCheck };
        case 'CANCELLED':
            return { text: 'Cancelada', color: 'text-red-400 bg-red-500/10', icon: XCircle };
        // --- AÑADIDO: Caso por defecto que garantiza que la función siempre devuelve un objeto ---
        default:
            return { text: 'Desconocido', color: 'text-gray-400 bg-gray-500/10', icon: Hourglass };
    }
}

const PartidaCard: React.FC<{ match: MatchWithDetails; onDelete: (matchId: string) => void; isLoading: boolean; }> = ({ match, onDelete, isLoading }) => {
    const statusInfo = getStatusInfo(match.status);
    const StatusIcon = statusInfo.icon;
    
    return (
        <div className="bg-gray-800 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="flex items-center gap-2 font-semibold text-white"><MapPin className="h-4 w-4 text-gray-400"/> {match.court.name}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-400 mt-1"><Calendar className="h-4 w-4"/> {new Date(match.matchTime).toLocaleDateString('es-ES')}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-400"><Clock className="h-4 w-4"/> {new Date(match.matchTime).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1 rounded-full ${statusInfo.color}`}>
                            <StatusIcon className="h-4 w-4" />
                            {statusInfo.text}
                        </span>
                    </div>
                    
                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="font-semibold text-gray-300 mb-2">Jugadores ({match.players.length}/4)</h4>
                        <div className="space-y-2">
                            {match.players.map((p, index) => (
                                <p key={p.user.id} className="text-sm text-gray-200">
                                    {index + 1}. {p.user.name}
                                </p>
                            ))}
                            {[...Array(4 - match.players.length)].map((_, index) => (
                                <p key={index} className="text-sm text-gray-500 italic">
                                    {match.players.length + index + 1}. Slot abierto...
                                </p>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
             <div className="border-t border-gray-700 mt-auto pt-4 px-6 pb-4 flex justify-end gap-2">
                <button 
                    onClick={() => onDelete(match.id)}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
                >
                    <XCircle className="h-4 w-4" />
                    Cancelar
                </button>
                <Link href={`/dashboard/partidas-abiertas/${match.id}`}>
                    <span className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20">
                        <Pencil className="h-4 w-4" />
                        Editar
                    </span>
                </Link>
            </div>
        </div>
    );
};

const PartidasAbiertasClient: React.FC<PartidasAbiertasClientProps> = ({ initialMatches }) => {
  const router = useRouter();
  const [matches, setMatches] = useState(initialMatches);
  const [isLoading, setIsLoading] = useState(false);

  const handleDeleteMatch = async (matchId: string) => {
    if (!window.confirm("¿Estás seguro de que quieres cancelar esta partida? Esta acción no se puede deshacer.")) {
        return;
    }
    setIsLoading(true);
    try {
        await fetch(`/api/open-matches/${matchId}`, { method: 'DELETE' });
        setMatches(prev => prev.filter(m => m.id !== matchId));
    } catch (error) {
        alert("Error al cancelar la partida.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div>
        {matches.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.map(match => (
                    <PartidaCard key={match.id} match={match} onDelete={handleDeleteMatch} isLoading={isLoading} />
                ))}
            </div>
        ) : (
             <div className="text-center py-16 bg-gray-800 rounded-xl">
                <p className="text-gray-400">No hay ninguna partida abierta en este momento.</p>
                <p className="text-sm text-gray-500 mt-1">Haz clic en "Abrir Partida" para crear una.</p>
            </div>
        )}
    </div>
  );
};

export default PartidasAbiertasClient;