// Path: src/components/partidas-abiertas/PartidasAbiertasClient.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { OpenMatch, Court } from '@prisma/client';
import { Calendar, Clock, MapPin, Users, ShieldCheck, Hourglass, XCircle, Pencil, BarChart3 } from 'lucide-react';
import Link from 'next/link';

type MatchWithDetails = OpenMatch & {
  court: { name: string };
  players: { user: { id: string; name: string | null } }[];
};

interface PartidasAbiertasClientProps {
  initialMatches: MatchWithDetails[];
  clubName: string;
}

const WhatsAppIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M16.6 14.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.7-.8.9-.1.1-.3.2-.5.1-.2-.1-.9-.3-1.8-1.1-.7-.6-1.1-1.4-1.3-1.6-.1-.2 0-.4.1-.5.1-.1.2-.2.4-.4.1-.1.2-.2.2-.4.1-.1.1-.3 0-.4-.1-.1-.6-1.5-.8-2-.2-.5-.4-.4-.5-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2 1 2.4c.1.1 1.5 2.3 3.6 3.2.5.2.8.3 1.1.4.5.1 1-.1 1.3-.3.4-.3.6-.8.8-1 .1-.2.1-.4 0-.5m-4.6 5.8c-2.9 0-5.5-1.2-7.5-3.1L2 18.8l1.6-1.5C2 15.3 1 12.8 1 10.1c0-4.9 4-8.9 8.9-8.9s8.9 4 8.9 8.9c0 4.9-4 8.9-8.9 8.9m0-19.5C5.2 1.5 1.5 5.2 1.5 10.1c0 2.9 1.4 5.6 3.6 7.2L3 22.5l5.2-1.9c1.5.8 3.2 1.3 4.8 1.3 5.4 0 9.8-4.4 9.8-9.8S17.4 1.5 12 1.5" />
  </svg>
);

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
        default:
            return { text: 'Desconocido', color: 'text-gray-400 bg-gray-500/10', icon: Hourglass };
    }
}

const PartidaCard: React.FC<{ match: MatchWithDetails; onDelete: (matchId: string) => void; isLoading: boolean; clubName: string; }> = ({ match, onDelete, isLoading, clubName }) => {
    const statusInfo = getStatusInfo(match.status);
    const StatusIcon = statusInfo.icon;
 
    let levelText = null;
    if (match.levelMin && match.levelMax) {
        levelText = `${match.levelMin} - ${match.levelMax}`;
    } else if (match.levelMin) {
        levelText = `Desde ${match.levelMin}`;
    } else if (match.levelMax) {
        levelText = `Hasta ${match.levelMax}`;
    }

    const handleShare = () => {
        const date = new Date(match.matchTime).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
        const time = new Date(match.matchTime).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const openSlots = 4 - match.players.length;

        // --- MODIFICADO: Mensaje sin emojis para máxima compatibilidad ---
        let message = `*¡Partida de pádel abierta en ${clubName}!*\n\n`;
        message += `*Fecha:* ${date}\n`;
        message += `*Hora:* ${time}h\n`;
        message += `*Pista:* ${match.court.name}\n`;
        if (levelText) {
            message += `*Nivel:* ${levelText}\n`;
        }
        message += `\n*Jugadores apuntados (${match.players.length}/4):*\n`;
        match.players.forEach((p, index) => {
            message += `${index + 1}. ${p.user.name}\n`;
        });
        
        if (openSlots > 0) {
            message += `\n*¡Faltan ${openSlots} jugadores${openSlots > 1 ? 'es' : ''}!*`;
        } else {
            message += `\n*¡Partida completa!*`;
        }

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
        window.open(whatsappUrl, '_blank');
    };
    
    return (
        <div className="bg-gray-800 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="flex items-center gap-2 font-semibold text-white"><MapPin className="h-4 w-4 text-gray-400"/> {match.court.name}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-400 mt-1"><Calendar className="h-4 w-4"/> {new Date(match.matchTime).toLocaleDateString('es-ES')}</p>
                            <p className="flex items-center gap-2 text-sm text-gray-400"><Clock className="h-4 w-4"/> {new Date(match.matchTime).toLocaleTimeString('es-ES', {hour: '2-digit', minute:'2-digit'})}</p>
                            {levelText && (
                               <p className="flex items-center gap-2 text-sm text-gray-400"><BarChart3 className="h-4 w-4"/> Nivel: {levelText}</p>
                            )}
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
             {/* --- MODIFICADO: Botones de acción con texto para mayor claridad --- */}
             <div className="border-t border-gray-700 mt-auto pt-4 px-6 pb-4 flex justify-end gap-2">
                <button 
                    onClick={handleShare}
                    className="flex-grow flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-500"
                    title="Compartir por WhatsApp"
                >
                    <WhatsAppIcon />
                    Compartir
                </button>
                <button 
                    onClick={() => onDelete(match.id)}
                    disabled={isLoading}
                    className="p-2 text-sm font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 disabled:opacity-50"
                    title="Cancelar Partida"
                >
                    <XCircle className="h-5 w-5" />
                </button>
                <Link href={`/dashboard/partidas-abiertas/${match.id}`} title="Editar Partida">
                    <span className="flex items-center gap-2 p-2 text-sm font-medium text-indigo-400 bg-indigo-500/10 rounded-lg hover:bg-indigo-500/20">
                        <Pencil className="h-5 w-5" />
                    </span>
                </Link>
            </div>
        </div>
    );
};

const PartidasAbiertasClient: React.FC<PartidasAbiertasClientProps> = ({ initialMatches, clubName }) => {
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
                    <PartidaCard key={match.id} match={match} onDelete={handleDeleteMatch} isLoading={isLoading} clubName={clubName} />
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