'use client'

import { useConsentimiento } from '@/hooks/use-consentimiento'

interface ScriptConsentidoProps {
  categoria: 'analiticas' | 'marketing'
  children: React.ReactNode
}

/**
 * Renderiza children solo si el usuario ha dado consentimiento
 * para la categoria indicada.
 *
 * Uso futuro:
 *   <ScriptConsentido categoria="analiticas">
 *     <Script src="https://www.googletagmanager.com/gtag/js" />
 *   </ScriptConsentido>
 */
export default function ScriptConsentido({ categoria, children }: ScriptConsentidoProps) {
  const { permitirAnaliticas, permitirMarketing } = useConsentimiento()

  if (categoria === 'analiticas' && !permitirAnaliticas) return null
  if (categoria === 'marketing' && !permitirMarketing) return null

  return <>{children}</>
}
