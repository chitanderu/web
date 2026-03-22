'use client'

import { useLayoutEffect } from 'react'

import { FullPageLoading } from '~/components/ui/loading'
import { useRouter } from '~/i18n/navigation'
import { buildNotePath } from '~/lib/note-route'

export default function NodeRedirect({
  created,
  nid,
  slug,
}: {
  created?: Date | string | null
  nid: number
  slug?: string | null
}) {
  const router = useRouter()
  useLayoutEffect(() => {
    router.replace(
      buildNotePath({
        nid,
        slug,
        created,
      }),
    )
  }, [created, nid, router, slug])
  return <FullPageLoading />
}
