import type { FC } from 'react'

import { AdvancedInput } from '~/components/ui/input'

import { useBaseWritingAtom } from './BaseWritingProvider'

export const TitleInput: FC<{
  label?: string
}> = ({ label }) => {
  const [title, setTitle] = useBaseWritingAtom('title')

  return (
    <AdvancedInput
      color="primary"
      inputClassName="text-base font-medium"
      label={label || '标题'}
      labelClassName="text-xs"
      labelPlacement="inside"
      value={title}
      onChange={(e) => setTitle(e.target.value)}
    />
  )
}
