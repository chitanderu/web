'use client'

import { useTranslations } from 'next-intl'
import { useEffect } from 'react'

export const dynamic = 'force-static'

export const AUTH_CALLBACK_CHANNEL = 'auth-oauth-callback'

export default function SocialCallbackPage() {
  const t = useTranslations('common')

  useEffect(() => {
    const bc = new BroadcastChannel(AUTH_CALLBACK_CHANNEL)
    bc.postMessage({ type: 'oauth-complete' })
    bc.close()
    window.close()
  }, [])

  return <p>{t('auth_callback_closing')}</p>
}
