import { format } from 'date-fns'
import type { FC } from 'react'
import { useEffect, useState } from 'react'

import { Input } from '~/components/ui/input'
import { isValidDate } from '~/lib/datetime'

export const SidebarDateInputField: FC<{
  label?: string
  getSet: [string | undefined, (value: any) => void]
}> = ({ label, getSet }) => {
  const [created, setCreated] = getSet

  const [editingCreated, setEditingCreated] = useState(created)

  const [reset, setReset] = useState(0)
  useEffect(() => {
    if (!created) return
    const date = new Date(created)
    if (!isValidDate(date)) return
    setEditingCreated(format(date, 'yyyy-MM-dd HH:mm:ss'))
  }, [created, reset])

  const [hasError, setHasError] = useState(false)
  useEffect(() => {
    if (!editingCreated) return
    if (isValidDate(new Date(editingCreated))) {
      setHasError(false)
    } else setHasError(true)
  }, [editingCreated, setCreated])

  return (
    <Input
      placeholder={created || ' '}
      value={editingCreated}
      onBlur={() => {
        if (!hasError) {
          setCreated(editingCreated)
        }
      }}
      onChange={(e) => {
        setEditingCreated(e.target.value)
      }}
    />
  )
}
