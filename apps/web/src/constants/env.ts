import { env } from 'next-runtime-env'

import { isClientSide, isDev } from '~/lib/env'

/** Public API URL - used by client and as fallback for server */
const PUBLIC_API_URL =
  env('NEXT_PUBLIC_API_URL') || process.env.NEXT_PUBLIC_API_URL || '/api/v2'

export const API_URL: string = (() => {
  if (isDev) return env('NEXT_PUBLIC_API_URL') || ''

  if (isClientSide) {
    if (env('NEXT_PUBLIC_CLIENT_API_URL')) {
      return env('NEXT_PUBLIC_CLIENT_API_URL') || ''
    }
    return PUBLIC_API_URL
  }

  // Server: use API_URL (internal network) if set, otherwise fall back to Public URL
  return env('API_URL') || PUBLIC_API_URL
})() as string
export const GATEWAY_URL =
  env('NEXT_PUBLIC_GATEWAY_URL') || process.env.NEXT_PUBLIC_GATEWAY_URL || ''
