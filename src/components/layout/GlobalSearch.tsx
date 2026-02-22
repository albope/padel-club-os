'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Users, Calendar, LayoutGrid, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SearchResult {
  tipo: 'socio' | 'pista' | 'reserva'
  id: string
  titulo: string
  subtitulo: string | null
  url: string
}

const iconoPorTipo = {
  socio: Users,
  pista: LayoutGrid,
  reserva: Calendar,
}

const etiquetaPorTipo = {
  socio: 'Socios',
  pista: 'Pistas',
  reserva: 'Reservas',
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)

  // Atajo Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Reset al abrir
  useEffect(() => {
    if (open) {
      setQuery('')
      setResults([])
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  // Busqueda con debounce
  const buscar = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) return
      const data = await res.json()
      setResults(data.resultados)
      setSelectedIndex(0)
    } catch { /* silenciar */ }
    finally { setLoading(false) }
  }, [])

  const handleQueryChange = (value: string) => {
    setQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => buscar(value), 300)
  }

  const navegar = (url: string) => {
    setOpen(false)
    router.push(url)
  }

  // Navegacion por teclado
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      e.preventDefault()
      navegar(results[selectedIndex].url)
    }
  }

  // Agrupar resultados por tipo
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    if (!acc[r.tipo]) acc[r.tipo] = []
    acc[r.tipo].push(r)
    return acc
  }, {})

  let globalIndex = 0

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9"
        onClick={() => setOpen(true)}
      >
        <Search className="h-5 w-5" />
        <span className="sr-only">Buscar</span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg p-0 gap-0 [&>button]:hidden">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Buscar socios, pistas, reservas..."
              className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
            {loading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
              ESC
            </kbd>
          </div>

          <div className="max-h-[300px] overflow-y-auto py-2">
            {query.length >= 2 && results.length === 0 && !loading && (
              <p className="text-center py-8 text-sm text-muted-foreground">
                Sin resultados para &quot;{query}&quot;
              </p>
            )}

            {Object.entries(grouped).map(([tipo, items]) => {
              const Icono = iconoPorTipo[tipo as keyof typeof iconoPorTipo]
              return (
                <div key={tipo}>
                  <p className="px-4 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {etiquetaPorTipo[tipo as keyof typeof etiquetaPorTipo]}
                  </p>
                  {items.map(item => {
                    const idx = globalIndex++
                    return (
                      <button
                        key={item.id}
                        onClick={() => navegar(item.url)}
                        className={cn(
                          "w-full flex items-center gap-3 px-4 py-2 text-left text-sm hover:bg-muted/50 transition-colors",
                          idx === selectedIndex && "bg-muted"
                        )}
                      >
                        <Icono className="h-4 w-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 overflow-hidden">
                          <p className="truncate font-medium">{item.titulo}</p>
                          {item.subtitulo && (
                            <p className="truncate text-xs text-muted-foreground">{item.subtitulo}</p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )
            })}
          </div>

          {query.length < 2 && results.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              <p>Escribe al menos 2 caracteres para buscar.</p>
              <p className="mt-1 text-xs">
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">Ctrl</kbd>
                {' + '}
                <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">K</kbd>
                {' para abrir la busqueda'}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
