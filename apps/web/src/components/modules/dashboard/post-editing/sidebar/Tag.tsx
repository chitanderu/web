import { atom, useAtom, useSetAtom } from 'jotai'
import type { FC } from 'react'
import { createContext, use, useEffect, useMemo, useRef } from 'react'

import { CloseIcon } from '~/components/icons/close'
import type { Suggestion } from '~/components/ui/auto-completion'
import { Autocomplete } from '~/components/ui/auto-completion'
import { MotionButtonBase } from '~/components/ui/button'
import { clsxm } from '~/lib/helper'

export interface TagProps {
  canClose?: boolean
  onClose?: () => void
}

export const PostTag: Component<TagProps> = ({
  className,
  children,
  canClose,
  onClose,
}) => (
  <div
    className={clsxm(
      'rounded-full border border-neutral-5/80 px-2 py-1',
      'relative inline-flex items-center gap-2',
      canClose && 'pr-1',
      className,
    )}
  >
    <span className="relative bottom-px">{children}</span>
    {canClose && (
      <MotionButtonBase
        className="inline-flex size-4 items-center justify-center"
        type="button"
        onClick={onClose}
      >
        <CloseIcon />
      </MotionButtonBase>
    )}
  </div>
)
const createTagEditingContextValue = () => ({
  isEditing: atom(false),
})
const TagEditingContext = createContext<
  ReturnType<typeof createTagEditingContextValue>
>(null!)

export const AddTag: Component<TagCompletionProp> = ({ ...props }) => {
  const ctxValue = useMemo(createTagEditingContextValue, [])
  const [isEditing, setIsEditing] = useAtom(ctxValue.isEditing)
  return (
    <TagEditingContext value={ctxValue}>
      <div
        className={clsxm(
          'border-foreground-400/80 flex size-6 items-center justify-center rounded-full border border-dashed',
          isEditing && 'hidden',
        )}
        onClick={() => {
          setIsEditing(true)
        }}
      >
        <i className="i-mingcute-add-line size-3" />
      </div>
      {isEditing && <TagCompletion {...props} />}
    </TagEditingContext>
  )
}

type TagBase = {
  label: string
  value: string
}

interface TagCompletionProp {
  allTags?: TagBase[]
  existsTags?: TagBase[]
  onEnter?: (value: string) => void
  onSelected?: (suggestion: Suggestion) => void
}

const TagCompletion: FC<TagCompletionProp> = (props) => {
  const { allTags, existsTags, onEnter, onSelected } = props
  const { isEditing } = use(TagEditingContext)
  const setIsEditing = useSetAtom(isEditing)
  const filteredSuggestions = useMemo<Suggestion[]>(() => {
    if (!allTags || !existsTags) return []

    const tagIdSet = new Set(existsTags.map((tag) => tag.value))
    return allTags
      .filter((tag) => !tagIdSet.has(tag.value))
      .map((tag) => ({
        name: tag.label,
        value: tag.value,
      }))
  }, [allTags, existsTags])

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <Autocomplete
      inputClassName="h-8"
      ref={inputRef}
      suggestions={filteredSuggestions}
      onConfirm={async (value) => {
        onEnter?.(value)
        setIsEditing(false)
      }}
      onSuggestionSelected={(suggestion) => {
        onSelected?.(suggestion)
        setIsEditing(false)
      }}
    />
  )
}
