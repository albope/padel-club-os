'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { Cookie } from 'lucide-react'
import { Button } from '@/components/ui/button'

const COOKIE_CONSENT_KEY = 'padel-cookie-consent'

type ConsentValue = 'all' | 'essential'

export default function CookieBanner() {
  const t = useTranslations('cookies')
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY)
    if (!consent) {
      setVisible(true)
    }
  }, [])

  function handleAccept(value: ConsentValue) {
    localStorage.setItem(COOKIE_CONSENT_KEY, value)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="container flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3 sm:items-center">
          <Cookie className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground sm:mt-0" />
          <p className="text-sm text-muted-foreground">
            {t('message')}{' '}
            <Link href="/cookies" className="text-primary underline-offset-4 hover:underline">
              {t('learnMore')}
            </Link>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAccept('essential')}
          >
            {t('onlyEssential')}
          </Button>
          <Button
            size="sm"
            onClick={() => handleAccept('all')}
          >
            {t('acceptAll')}
          </Button>
        </div>
      </div>
    </div>
  )
}
