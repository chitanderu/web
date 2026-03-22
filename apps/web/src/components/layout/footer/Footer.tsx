import { FooterInfo } from './FooterInfo'
import { FooterThemeSwitcher } from './FooterThemeSwitcher'
import { LocaleSwitcher } from './LocaleSwitcher'

export const Footer = async () => (
  <>
    {/* Gradient fade boundary */}
    <div
      data-hide-print
      className="relative z-[1] mt-32 -mb-px h-9 md:h-16"
      style={{
        background:
          'linear-gradient(to bottom, transparent, color-mix(in oklab, var(--color-accent) 5%, var(--color-root-bg, #fff)))',
      }}
    />

    <footer
      data-hide-print
      className="relative z-[1] pb-12 pt-0"
      style={{
        background:
          'color-mix(in oklab, var(--color-accent) 5%, var(--color-root-bg, #fff))',
      }}
    >
      <div className="px-4 sm:px-8">
        <div className="mx-auto max-w-7xl lg:px-8">
          <FooterInfo
            localeSwitcher={<LocaleSwitcher />}
            themeSwitcher={<FooterThemeSwitcher />}
          />
        </div>
      </div>
    </footer>
  </>
)
