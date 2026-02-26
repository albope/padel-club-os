'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'

/**
 * Error boundary de ultimo recurso — captura errores del root layout.
 * Usa inline styles porque no tiene acceso a providers ni design system.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px', padding: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '8px' }}>
              Algo salio mal
            </h2>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '16px' }}>
              Ha ocurrido un error inesperado. Por favor, intentalo de nuevo.
            </p>
            <button
              onClick={reset}
              style={{
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                cursor: 'pointer',
                fontSize: '0.875rem',
              }}
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
