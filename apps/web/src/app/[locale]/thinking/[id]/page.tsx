import { getTranslations } from 'next-intl/server'
import { Suspense } from 'react'

import { CommentBoxRootLazy, CommentsLazy } from '~/components/modules/comment'
import { MotionButtonBase } from '~/components/ui/button'
import { Link } from '~/i18n/navigation'
import { apiClient } from '~/lib/request'

import { ThinkingItem } from '../item'

export default async function Page(props: {
  params: Promise<{
    id: string
    locale: string
  }>
}) {
  const params = await props.params
  const { locale } = params
  const data = await apiClient.recently.getById(params.id)
  const tThinking = await getTranslations({
    locale,
    namespace: 'thinking',
  })
  const tCommon = await getTranslations({
    locale,
    namespace: 'common',
  })

  return (
    <div>
      <header className="prose">
        <h1 className="flex items-end gap-2">
          {tThinking('page_title')}
          <a
            aria-hidden
            className="center flex size-8 select-none text-[#EE802F]"
            data-event="Say RSS click"
            href="/thinking/feed"
            rel="noreferrer"
            target="_blank"
          >
            <i className="i-mingcute-rss-fill" />
          </a>
        </h1>
        <h3>{tThinking('page_subtitle')}</h3>
      </header>

      <main className="-mt-12">
        <MotionButtonBase>
          <Link
            className="flex items-center gap-2"
            data-event="Say back click"
            href="/thinking"
          >
            <i className="i-mingcute-arrow-left-circle-line" />
            {tCommon('actions_back')}
          </Link>
        </MotionButtonBase>
        <ThinkingItem item={data.$serialized} />

        {data.allowComment && (
          <Suspense>
            <CommentBoxRootLazy className="mb-12 mt-6" refId={data.id} />
            <CommentsLazy refId={data.id} />
          </Suspense>
        )}
      </main>
    </div>
  )
}
