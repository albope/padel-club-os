'use client'

import { useState, useEffect, useCallback } from 'react'

const COOKIE_CONSENT_KEY = 'padel-cookie-consent'

export type TipoConsentimiento = 'all' | 'essential' | null

export function useConsentimiento() {
  const [consentimiento, setConsentimiento] = useState<TipoConsentimiento>(null)

  useEffect(() => {
    const valor = localStorage.getItem(COOKIE_CONSENT_KEY) as TipoConsentimiento
    setConsentimiento(valor)
  }, [])

  const aceptar = useCallback((tipo: 'all' | 'essential') => {
    localStorage.setItem(COOKIE_CONSENT_KEY, tipo)
    setConsentimiento(tipo)
  }, [])

  const permitirAnaliticas = consentimiento === 'all'
  const permitirMarketing = consentimiento === 'all'
  const decidido = consentimiento !== null

  return {
    consentimiento,
    aceptar,
    permitirAnaliticas,
    permitirMarketing,
    decidido,
  }
}
