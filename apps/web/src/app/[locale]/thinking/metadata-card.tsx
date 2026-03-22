import type {
  AcademicMetadata,
  BookMetadata,
  CodeMetadata,
  GithubMetadata,
  LinkMetadata,
  MediaMetadata,
  MusicMetadata,
  RecentlyMetadata,
} from '@mx-space/api-client'
import { RecentlyTypeEnum } from '@mx-space/api-client'
import type { FC } from 'react'

export const MetadataCard: FC<{
  type: RecentlyTypeEnum
  metadata?: RecentlyMetadata
}> = ({ type, metadata }) => {
  if (!metadata || type === RecentlyTypeEnum.Text) return null

  const cardContent = (() => {
    switch (type) {
      case RecentlyTypeEnum.Book: {
        return <BookCard metadata={metadata as BookMetadata} />
      }
      case RecentlyTypeEnum.Media: {
        return <MediaCard metadata={metadata as MediaMetadata} />
      }
      case RecentlyTypeEnum.Music: {
        return <MusicCard metadata={metadata as MusicMetadata} />
      }
      case RecentlyTypeEnum.Github: {
        return <GithubCard metadata={metadata as GithubMetadata} />
      }
      case RecentlyTypeEnum.Link: {
        return <GenericLinkCard metadata={metadata as LinkMetadata} />
      }
      case RecentlyTypeEnum.Academic: {
        return <AcademicCard metadata={metadata as AcademicMetadata} />
      }
      case RecentlyTypeEnum.Code: {
        return <CodeCard metadata={metadata as CodeMetadata} />
      }
      default: {
        return null
      }
    }
  })()

  if (!cardContent) return null

  return (
    <a
      className="mt-2 block overflow-hidden rounded-xl border border-neutral-3 transition-colors hover:border-neutral-4"
      href={(metadata as any).url}
      rel="noreferrer"
      target="_blank"
    >
      {cardContent}
    </a>
  )
}

const Rating: FC<{ value: number }> = ({ value }) => (
  <span className="text-xs text-amber-500">
    {'★'.repeat(Math.round(value / 2))}
    {'☆'.repeat(5 - Math.round(value / 2))}
    <span className="ml-1 font-medium">{value}</span>
  </span>
)

const BookCard: FC<{ metadata: BookMetadata }> = ({ metadata }) => (
  <div className="flex gap-3 p-3">
    {metadata.cover && (
      <img
        alt={metadata.title}
        className="h-[100px] w-[70px] shrink-0 rounded object-cover shadow"
        src={metadata.cover}
      />
    )}
    <div className="min-w-0 flex-1">
      <h4 className="truncate text-sm font-semibold">{metadata.title}</h4>
      <p className="mt-0.5 text-xs text-neutral-7">{metadata.author}</p>
      {metadata.rating != null && (
        <div className="mt-1">
          <Rating value={metadata.rating} />
        </div>
      )}
    </div>
  </div>
)

const MediaCard: FC<{ metadata: MediaMetadata }> = ({ metadata }) => (
  <div className="flex flex-row-reverse">
    {metadata.cover && (
      <img
        alt={metadata.title}
        className="h-[160px] w-[120px] shrink-0 object-cover"
        src={metadata.cover}
      />
    )}
    <div className="flex min-w-0 flex-1 flex-col justify-center p-3">
      <h4 className="text-sm font-semibold">{metadata.title}</h4>
      {metadata.originalTitle && (
        <p className="mt-0.5 text-xs text-neutral-6">
          {metadata.originalTitle}
          {metadata.genre && <span> · {metadata.genre}</span>}
        </p>
      )}
      {metadata.rating != null && (
        <div className="mt-1">
          <Rating value={metadata.rating} />
        </div>
      )}
      {metadata.description && (
        <p className="mt-1.5 line-clamp-3 text-xs text-neutral-7">
          {metadata.description}
        </p>
      )}
    </div>
  </div>
)

const MusicCard: FC<{ metadata: MusicMetadata }> = ({ metadata }) => (
  <div className="flex items-center gap-3 p-3">
    {metadata.cover ? (
      <img
        alt={metadata.title}
        className="size-12 shrink-0 rounded-md object-cover"
        src={metadata.cover}
      />
    ) : (
      <div className="center flex size-12 shrink-0 rounded-md bg-red-900/20 text-lg">
        🎵
      </div>
    )}
    <div className="min-w-0 flex-1">
      <h4 className="truncate text-sm font-semibold">{metadata.title}</h4>
      <p className="truncate text-xs text-neutral-7">
        {metadata.artist}
        {metadata.album && <span> · {metadata.album}</span>}
      </p>
    </div>
    {metadata.source && (
      <span className="shrink-0 text-[10px] font-medium text-red-500">
        {metadata.source}
      </span>
    )}
  </div>
)

const GithubCard: FC<{ metadata: GithubMetadata }> = ({ metadata }) => (
  <div className="p-3">
    <div className="flex items-center gap-2">
      <span className="text-sm font-medium text-blue-400">
        {metadata.owner}/{metadata.repo}
      </span>
    </div>
    {metadata.description && (
      <p className="mt-1 text-xs text-neutral-6">{metadata.description}</p>
    )}
    <div className="mt-2 flex gap-4 text-xs text-neutral-7">
      {metadata.language && (
        <span className="flex items-center gap-1">
          <span
            className="inline-block size-2.5 rounded-full"
            style={{ background: metadata.languageColor || '#888' }}
          />
          {metadata.language}
        </span>
      )}
      {metadata.stars != null && (
        <span className="flex items-center gap-1">
          <i className="i-mingcute-star-line text-amber-400" />
          {metadata.stars.toLocaleString()}
        </span>
      )}
    </div>
  </div>
)

const GenericLinkCard: FC<{ metadata: LinkMetadata }> = ({ metadata }) => (
  <div className="flex">
    <div className="min-w-0 flex-1 p-3">
      <p className="text-[10px] uppercase tracking-wider text-neutral-6">
        {(() => {
          try {
            return new URL(metadata.url).hostname
          } catch {
            return ''
          }
        })()}
      </p>
      {metadata.title && (
        <h4 className="mt-0.5 truncate text-sm font-semibold">
          {metadata.title}
        </h4>
      )}
      {metadata.description && (
        <p className="mt-0.5 line-clamp-2 text-xs text-neutral-7">
          {metadata.description}
        </p>
      )}
    </div>
    {metadata.image && (
      <img
        alt=""
        className="h-[80px] w-[120px] shrink-0 object-cover"
        src={metadata.image}
      />
    )}
  </div>
)

const AcademicCard: FC<{ metadata: AcademicMetadata }> = ({ metadata }) => (
  <div className="p-3">
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-amber-500">
        {metadata.arxivId ? `arXiv:${metadata.arxivId}` : 'Paper'}
      </span>
    </div>
    <h4 className="mt-1 text-sm font-semibold">{metadata.title}</h4>
    {metadata.authors && metadata.authors.length > 0 && (
      <p className="mt-1 text-xs text-neutral-7">
        {metadata.authors.join(', ')}
      </p>
    )}
  </div>
)

const CodeCard: FC<{ metadata: CodeMetadata }> = ({ metadata }) => (
  <div className="p-3">
    <div className="flex items-center gap-2">
      {metadata.platform && (
        <span className="text-xs font-medium text-neutral-6">
          {metadata.platform}
        </span>
      )}
      {metadata.difficulty && (
        <span
          className={`text-xs font-medium ${
            metadata.difficulty.toLowerCase() === 'easy'
              ? 'text-teal-500'
              : metadata.difficulty.toLowerCase() === 'medium'
                ? 'text-orange-500'
                : 'text-red-500'
          }`}
        >
          {metadata.difficulty}
        </span>
      )}
    </div>
    <h4 className="mt-1 text-sm font-semibold">{metadata.title}</h4>
    {metadata.tags && metadata.tags.length > 0 && (
      <div className="mt-1.5 flex flex-wrap gap-1">
        {metadata.tags.map((tag) => (
          <span
            className="rounded bg-neutral-2 px-1.5 py-0.5 text-[10px]"
            key={tag}
          >
            {tag}
          </span>
        ))}
      </div>
    )}
  </div>
)
