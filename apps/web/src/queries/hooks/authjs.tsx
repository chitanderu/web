import { useQuery, useQueryClient } from '@tanstack/react-query'
import { m } from 'motion/react'
import Image from 'next/image'
import { useLocale } from 'next-intl'
import type { FC } from 'react'
import { Fragment, useCallback, useEffect, useRef, useState } from 'react'

import { useIsMobile } from '~/atoms/hooks/viewport'
import { GitHubBrandIcon } from '~/components/icons/platform/GitHubBrandIcon'
import { MotionButtonBase } from '~/components/ui/button'
import { useModalStack } from '~/components/ui/modal'
import { useCurrentModal } from '~/components/ui/modal/stacked/context'
import { defaultLocale } from '~/i18n/config'
import type { AuthSocialProviders } from '~/lib/authjs'
import { authClient } from '~/lib/authjs'
import { apiClient } from '~/lib/request'
import { useAggregationSelector } from '~/providers/root/aggregation-data-provider'

const AUTH_CALLBACK_CHANNEL = 'auth-oauth-callback'

export const useAuthProviders = () => {
  const { data } = useQuery({
    queryKey: ['providers'],
    queryFn: () =>
      apiClient.proxy.auth.providers
        .get<{
          data: AuthSocialProviders[]
        }>()
        .then((res) => res.data),
    refetchOnMount: 'always',
    meta: {
      persist: true,
    },
  })
  return data
}
export const useHasProviders = () => {
  const providers = useAuthProviders()
  return !!providers?.length
}

export const useOauthLoginModal = () => {
  const { present } = useModalStack()

  return useCallback(() => {
    present({
      title: '',
      overlay: true,
      clickOutsideToDismiss: true,
      CustomModalComponent: ({ children }) => <div>{children}</div>,
      content: AuthjsLoginModalContent,
    })
  }, [present])
}

function openOAuthPopup(url: string) {
  const width = 600
  const height = 700
  const left = window.screenX + (window.outerWidth - width) / 2
  const top = window.screenY + (window.outerHeight - height) / 2
  return window.open(
    url,
    'oauth-popup',
    `width=${width},height=${height},left=${left},top=${top},toolbar=no,menubar=no`,
  )
}

export const AuthProvidersRender: FC<{ onSuccess?: () => void }> = ({
  onSuccess,
}) => {
  const providers = useAuthProviders()
  const queryClient = useQueryClient()
  const locale = useLocale()
  const [authProcessingLockSet, setAuthProcessingLockSet] = useState(
    () => new Set<AuthSocialProviders>(),
  )
  const popupRef = useRef<Window | null>(null)

  useEffect(() => {
    const bc = new BroadcastChannel(AUTH_CALLBACK_CHANNEL)
    bc.onmessage = (event) => {
      if (event.data?.type === 'oauth-complete') {
        queryClient.invalidateQueries({ queryKey: ['session'] })
        setAuthProcessingLockSet(new Set())
        popupRef.current = null
        onSuccess?.()
      }
    }

    return () => bc.close()
  }, [queryClient, onSuccess])

  // Fallback: detect popup closed manually (e.g. user closed it, or popup blocker)
  useEffect(() => {
    if (authProcessingLockSet.size === 0) return

    const timer = setInterval(() => {
      if (popupRef.current && popupRef.current.closed) {
        queryClient.invalidateQueries({ queryKey: ['session'] })
        setAuthProcessingLockSet(new Set())
        popupRef.current = null
        onSuccess?.()
      }
    }, 500)

    return () => clearInterval(timer)
  }, [authProcessingLockSet.size, queryClient, onSuccess])

  return (
    <>
      {providers && (
        <ul className="flex items-center justify-center gap-3">
          {providers.map((provider) => (
            <li key={provider}>
              <MotionButtonBase
                disabled={authProcessingLockSet.has(provider)}
                onClick={async () => {
                  if (authProcessingLockSet.has(provider)) return

                  setAuthProcessingLockSet((prev) => {
                    prev.add(provider)
                    return new Set(prev)
                  })

                  const localePrefix =
                    locale === defaultLocale ? '' : `/${locale}`
                  const callbackURL = `${window.location.origin}${localePrefix}/auth/social-callback`
                  const res = await authClient.signIn.social({
                    provider,
                    callbackURL,
                    disableRedirect: true,
                  })

                  const url = res.data?.url
                  if (url) {
                    const popup = openOAuthPopup(url)
                    if (popup) {
                      popupRef.current = popup
                    } else {
                      // Popup blocked, fallback to same-window redirect
                      window.location.href = url
                    }
                  } else {
                    setAuthProcessingLockSet(new Set())
                  }
                }}
              >
                <div className="flex size-10 items-center justify-center rounded-full border bg-neutral-1 border-neutral-3">
                  {!authProcessingLockSet.has(provider) ? (
                    <Fragment>
                      {provider === 'github' ? (
                        <GitHubBrandIcon />
                      ) : (
                        <img
                          className="size-4"
                          src={`https://authjs.dev/img/providers/${provider}.svg`}
                        />
                      )}
                    </Fragment>
                  ) : (
                    <div className="center flex">
                      <i className="loading loading-spinner loading-xs opacity-50" />
                    </div>
                  )}
                </div>
              </MotionButtonBase>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

const AuthjsLoginModalContent = () => {
  const title = useAggregationSelector((s) => s.seo.title)
  const ownerAvatar = useAggregationSelector((s) => s.user.avatar)!
  const { dismiss } = useCurrentModal()

  const isMobile = useIsMobile()

  const Inner = (
    <>
      <div className="-mt-24 mb-4 flex items-center justify-center md:-mt-12">
        <Image
          alt="site owner"
          className="rounded-full shadow-lg"
          height={60}
          src={ownerAvatar}
          width={60}
        />
      </div>
      <div className="-mt-0 text-center">
        登录到 <b>{title}</b>
      </div>

      <div className="mt-6">
        <AuthProvidersRender onSuccess={dismiss} />
      </div>
    </>
  )
  if (isMobile) {
    return Inner
  }

  return (
    <m.div
      animate={{ opacity: 1, y: 0 }}
      className="absolute left-1/2 top-1/2"
      exit={{ opacity: 0, y: 10, transition: { type: 'tween' } }}
      initial={{ opacity: 0, y: 10 }}
      transition={{ type: 'spring' }}
    >
      <div className="w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-neutral-3 bg-neutral-1 p-3 shadow-2xl shadow-neutral-4">
        {Inner}
      </div>
    </m.div>
  )
}
