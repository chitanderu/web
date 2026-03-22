import './FullScreenGallery.css'

import { useIsomorphicLayoutEffect } from 'foxact/use-isomorphic-layout-effect'
import type { FC } from 'react'
import { useRef } from 'react'

import type { GalleryImageType } from '../Gallery'

export const FullScreenGallery: FC<{ images: GalleryImageType[] }> = (
  props,
) => {
  const { images } = props
  const prevScrolltopRef = useRef(0)
  useIsomorphicLayoutEffect(() => {
    prevScrolltopRef.current = document.documentElement.scrollTop
    const $root = document.querySelector('#root') as HTMLElement
    if (!$root) return
    $root.style.display = 'none'
    document.documentElement.scrollTop = 0
    return () => {
      $root.style.display = ''

      document.documentElement.scrollTop = prevScrolltopRef.current
    }
  }, [])

  return (
    <div
      className="fullscreen-gallery"
      style={
        {
          '--count': images.length,
        } as any
      }
    >
      <aside>
        <nav>
          <ul>
            {images.map((image, index) => (
              <li key={index}>
                <a href={`#img-${index}`}>
                  <img alt={image.name} src={image.url} />
                  <span>{image.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <main>
        {images.map((image, index) => (
          <figure id={`img-${index}`} key={index}>
            <img alt={image.name} src={image.url} />
            <figcaption>{image.name}</figcaption>
          </figure>
        ))}
      </main>
    </div>
  )
}
