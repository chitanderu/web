'use client'

import NumberFlow from '@number-flow/react'

export const NumberSmoothTransition = (props: {
  children: string | number
}) => {
  const { children } = props
  const value = typeof children === 'string' ? Number(children) || 0 : children
  return (
    <NumberFlow
      style={{ fontVariantNumeric: 'tabular-nums', verticalAlign: 'middle' }}
      value={value}
    />
  )
}
