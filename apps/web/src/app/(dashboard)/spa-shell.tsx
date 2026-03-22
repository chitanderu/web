'use client'

import { useQuery } from '@tanstack/react-query'
import type { PropsWithChildren } from 'react'

import { ClientOnly } from '~/components/common/ClientOnly'
import { MainLayout } from '~/components/modules/dashboard/layouts'
import { FABContainer } from '~/components/ui/fab'
import { AggregationProvider } from '~/providers/root/aggregation-data-provider'
import { aggregation } from '~/queries/definition/aggregation'

export function DashboardClientShell({ children }: PropsWithChildren) {
  const { data, isLoading, error } = useQuery(aggregation.root())

  return (
    <ClientOnly>
      {isLoading ? (
        <div className="center fixed left-0 top-0 flex size-full">
          <i className="loading loading-dots" />
        </div>
      ) : error || !data ? (
        <div className="center fixed left-0 top-0 flex size-full px-6 text-center">
          Dashboard initial data load failed.
        </div>
      ) : (
        <AggregationProvider
          aggregationData={data as any}
          appConfig={data.theme.config}
        >
          <MainLayout>{children}</MainLayout>
          <FABContainer />
        </AggregationProvider>
      )}
    </ClientOnly>
  )
}
