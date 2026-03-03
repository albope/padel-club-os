'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { useLocale } from 'next-intl';
import Image from 'next/image';

interface ChatMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorImage: string | null;
  esPropio: boolean;
  createdAt: string;
}

interface PartidaChatProps {
  openMatchId: string;
  isOpen: boolean;
  onClose: () => void;
  matchInfo: {
    courtName: string;
    matchTime: string;
  };
}

const POLL_INTERVAL = 10_000; // 10 segundos

export function PartidaChat({ openMatchId, isOpen, onClose, matchInfo }: PartidaChatProps) {
  const t = useTranslations('social');
  const locale = useLocale();
  const localeCode = locale === 'es' ? 'es-ES' : 'en-GB';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoadingInitial, setIsLoadingInitial] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastTimestampRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  const fetchMensajes = useCallback(async (since?: string) => {
    try {
      const params = since ? `?since=${encodeURIComponent(since)}` : '';
      const res = await fetch(`/api/player/chat/${openMatchId}${params}`);
      if (res.ok) {
        const data = await res.json();
        if (since) {
          // Polling incremental: append nuevos mensajes
          if (data.messages.length > 0) {
            setMessages((prev) => [...prev, ...data.messages]);
            lastTimestampRef.current = data.messages[data.messages.length - 1].createdAt;
          }
        } else {
          // Carga inicial
          setMessages(data.messages);
          if (data.messages.length > 0) {
            lastTimestampRef.current = data.messages[data.messages.length - 1].createdAt;
          }
        }
      }
    } catch { /* silenciar */ }
    finally { setIsLoadingInitial(false); }
  }, [openMatchId]);

  // Carga inicial + polling
  useEffect(() => {
    if (!isOpen) return;

    setIsLoadingInitial(true);
    setMessages([]);
    lastTimestampRef.current = null;
    fetchMensajes();

    const intervalo = setInterval(() => {
      fetchMensajes(lastTimestampRef.current || undefined);
    }, POLL_INTERVAL);

    return () => clearInterval(intervalo);
  }, [isOpen, openMatchId, fetchMensajes]);

  // Auto-scroll al llegar nuevos mensajes
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/player/chat/${openMatchId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
        lastTimestampRef.current = data.message.createdAt;
        setInputValue('');
      } else {
        const data = await res.json();
        // No toast para rate limit - solo ignorar
        if (res.status !== 429) {
          console.error('Error al enviar mensaje:', data.error);
        }
      }
    } catch { /* silenciar */ }
    finally { setIsSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(localeCode, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const matchDate = new Date(matchInfo.matchTime).toLocaleDateString(localeCode, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

  const matchHour = new Date(matchInfo.matchTime).toLocaleTimeString(localeCode, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base">
            <MessageCircle className="h-4 w-4" />
            {matchInfo.courtName} · {matchDate} {matchHour}
          </SheetTitle>
        </SheetHeader>

        {/* Mensajes */}
        <ScrollArea className="flex-1 px-4" ref={scrollRef}>
          <div className="py-4 space-y-3">
            {isLoadingInitial ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageCircle className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-sm text-muted-foreground">{t('chatEmpty')}</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-2 max-w-[85%]',
                    msg.esPropio ? 'ml-auto flex-row-reverse' : ''
                  )}
                >
                  {/* Avatar (solo mensajes ajenos) */}
                  {!msg.esPropio && (
                    msg.authorImage ? (
                      <Image
                        src={msg.authorImage}
                        alt={msg.authorName}
                        width={28}
                        height={28}
                        className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5"
                      />
                    ) : (
                      <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold shrink-0 mt-0.5">
                        {msg.authorName.charAt(0)}
                      </div>
                    )
                  )}

                  <div>
                    {/* Nombre (solo mensajes ajenos) */}
                    {!msg.esPropio && (
                      <p className="text-[11px] text-muted-foreground mb-0.5 font-medium">
                        {msg.authorName}
                      </p>
                    )}
                    <div
                      className={cn(
                        'rounded-2xl px-3 py-2 text-sm',
                        msg.esPropio
                          ? 'bg-primary/10 text-foreground rounded-tr-sm'
                          : 'bg-muted rounded-tl-sm'
                      )}
                    >
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    </div>
                    <p className={cn(
                      'text-[10px] text-muted-foreground mt-0.5',
                      msg.esPropio ? 'text-right' : ''
                    )}>
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t p-3 flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('chatPlaceholder')}
            maxLength={500}
            disabled={isSending}
            className="flex-1"
            aria-label={t('chatPlaceholder')}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim() || isSending}
            aria-label={t('sendMessage')}
          >
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
