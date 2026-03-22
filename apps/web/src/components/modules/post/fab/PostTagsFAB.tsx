'use client'

import type { TagModel } from '@mx-space/api-client'
import { useQuery } from '@tanstack/react-query'
import { memo, useCallback } from 'react'

import { EmptyIcon } from '~/components/icons/empty'
import { FABPortable } from '~/components/ui/fab'
import { Loading } from '~/components/ui/loading'
import { useModalStack } from '~/components/ui/modal'
import { Tag } from '~/components/ui/tag/Tag'
import { Link } from '~/i18n/navigation'
import { apiClient } from '~/lib/request'
import { routeBuilder, Routes } from '~/lib/route-builder'

export const PostTagsFAB = () => {
  const { present } = useModalStack()
  return (
    <FABPortable
      onClick={() => {
        present({
          content: TagsModal,
          clickOutsideToDismiss: true,
          title: '标签云',
          modalClassName: 'w-[900px] max-w-full',
        })
      }}
    >
      <i className="i-mingcute-hashtag-line" />
    </FABPortable>
  )
}

const TagsModal = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['tags'],
    queryFn: async () => (await apiClient.category.getAllTags()).data,
  })

  const { present } = useModalStack()
  const handleTagClick = useCallback(
    (tag: TagModel) => {
      present({
        content: () => <TagDetailModal {...tag} />,
        title: (
          <div className="flex items-center gap-2">
            Tag: {tag.name}
            <a
              aria-label={`Go to ${tag.name} tag detail`}
              href={routeBuilder(Routes.Tag, { name: tag.name })}
              rel="noreferrer"
              target="_blank"
            >
              <i className="i-mingcute-arrow-right-up-line translate-y-[2px] opacity-70" />
            </a>
          </div>
        ),
      })
    },
    [present],
  )
  if (isLoading) return <Loading />
  if (!data) return <EmptyIcon />
  return (
    <div className="flex flex-wrap gap-3">
      {data.map((tag) => (
        <TagInternal key={tag.name} {...tag} onClick={handleTagClick} />
      ))}
    </div>
  )
}

const TagInternal = memo(function TagInternal(
  props: TagModel & {
    onClick?: (tag: TagModel) => void
  },
) {
  const { count, name } = props

  return (
    // @ts-ignore
    <Tag count={count} passProps={props} text={name} onClick={props.onClick} />
  )
})

export const TagDetailModal = (props: { name: string }) => {
  const { name } = props
  const { data, isLoading } = useQuery({
    queryKey: [name, 'tag'],
    queryFn: async ({ queryKey }) => {
      const [tagName] = queryKey
      return (await apiClient.category.getTagByName(tagName)).data
    },
    staleTime: 1000 * 60 * 60 * 24,
  })
  const { dismissAll } = useModalStack()
  if (isLoading)
    return (
      <div className="center flex h-24 w-full">
        <div className="loading loading-dots loading-md" />
      </div>
    )

  if (!data) return <EmptyIcon />

  return (
    <ul className="space-y-2">
      {data
        .sort(
          (a, b) =>
            new Date(b.created).getTime() - new Date(a.created).getTime(),
        )
        .map((item) => (
          <li
            className="flex items-center gap-3"
            data-id={item.id}
            key={item.id}
          >
            <span className="shrink-0 text-sm tabular-nums text-neutral-4">
              {Intl.DateTimeFormat('en-us', {
                month: '2-digit',
                day: '2-digit',
                year: '2-digit',
              }).format(new Date(item.created))}
            </span>
            <Link
              className="shiro-link--underline min-w-0 truncate text-base leading-6"
              href={routeBuilder(Routes.Post, {
                category: item.category.slug,
                slug: item.slug,
              })}
              onClick={() => {
                dismissAll()
              }}
            >
              {item.title}
            </Link>
          </li>
        ))}
    </ul>
  )
}
