import 'server-only'

type QueryValue = boolean | number | string | null | undefined

const ABSOLUTE_URL_RE = /^https?:\/\//i

const getServerApiBaseUrl = () =>
  process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || ''

const withTrailingSlash = (value: string) =>
  value.endsWith('/') ? value : `${value}/`

const normalizeOriginPath = (value: string) =>
  value.startsWith('/') ? value : `/${value}`

const buildUrl = (
  path: string,
  {
    origin,
    relativeToApiBase = true,
  }: {
    origin?: string
    relativeToApiBase?: boolean
  } = {},
) => {
  if (ABSOLUTE_URL_RE.test(path)) {
    return new URL(path)
  }

  const apiBaseUrl = getServerApiBaseUrl()
  if (!apiBaseUrl) {
    throw new Error('Missing API_URL or NEXT_PUBLIC_API_URL for server fetches')
  }

  if (ABSOLUTE_URL_RE.test(apiBaseUrl)) {
    const baseUrl = new URL(apiBaseUrl)

    if (!relativeToApiBase && path.startsWith('/')) {
      return new URL(path, baseUrl.origin)
    }

    return new URL(
      path.startsWith('/') && relativeToApiBase ? path.slice(1) : path,
      withTrailingSlash(baseUrl.toString()),
    )
  }

  if (!origin) {
    throw new Error(
      `Relative API base URL "${apiBaseUrl}" requires a request origin`,
    )
  }

  if (!relativeToApiBase && path.startsWith('/')) {
    return new URL(path, origin)
  }

  return new URL(
    `${normalizeOriginPath(apiBaseUrl).replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`,
    origin,
  )
}

export const fetchServerApiJson = async <T>(
  path: string,
  {
    headers,
    locale,
    next,
    origin,
    query,
    relativeToApiBase = true,
  }: {
    headers?: HeadersInit
    locale?: string
    next?: RequestInit['next']
    origin?: string
    query?: Record<string, QueryValue>
    relativeToApiBase?: boolean
  } = {},
) => {
  const url = buildUrl(path, { origin, relativeToApiBase })

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null) continue
      url.searchParams.set(key, String(value))
    }
  }

  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(locale ? { 'x-lang': locale } : {}),
      ...headers,
    },
    next,
  })

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`)
  }

  return (await response.json()) as T
}
