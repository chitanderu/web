import type { FC } from 'react'

import { clsxm } from '~/lib/helper'

import styles from './LinkCard.module.css'
import { pluginMap } from './plugins'

const typeClassMap = {
  academic: styles.academic,
  github: styles.github,
  media: styles.media,
  wide: styles.wide,
} as const

export const LinkCardSkeleton: FC<{
  className?: string
  source?: string
}> = ({ className, source }) => {
  const plugin = source ? pluginMap.get(source) : undefined
  const typeClass = plugin?.typeClass
    ? typeClassMap[plugin.typeClass as keyof typeof typeClassMap]
    : undefined

  return (
    <span
      data-hide-print
      className={clsxm(styles.card, styles.skeleton, typeClass, className)}
    >
      <span className={styles.content}>
        <span className={styles.title} />
        <span className={styles.desc} />
      </span>
      <span className={styles.image} />
    </span>
  )
}
