import { useLayoutEffect } from 'react'

import { useResolveAdminUrl } from '~/atoms/hooks/url'
import { defineRouteConfig } from '~/components/modules/dashboard/utils/helper'
import { FullPageLoading } from '~/components/ui/loading'
import { useRouter } from '~/i18n/navigation'

export const Component = () => {
  const toAdminUrl = useResolveAdminUrl()
  const router = useRouter()

  useLayoutEffect(() => {
    const adminUrl = toAdminUrl()

    if (adminUrl) {
      location.href = adminUrl
    }
  }, [router, toAdminUrl])
  return <FullPageLoading />
}

export const config = defineRouteConfig({
  title: '完整功能与其他设置',
  icon: <i className="i-mingcute-settings-line" />,
  priority: 10e2,
})
