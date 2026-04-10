import {
  ClipboardList,
  Palette,
  Zap,
  Paintbrush,
  Layers,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface FeatureItem {
  icon: LucideIcon
  key: string
  accent: string
  span: string
}

const featuresMeta: FeatureItem[] = [
  { icon: Zap, key: 'live', accent: 'bg-[#8B6914]/8 text-[#8B6914]', span: 'md:col-span-2' },
  { icon: ClipboardList, key: 'form', accent: 'bg-accent/8 text-accent', span: 'md:col-span-1' },
  { icon: Palette, key: 'templates', accent: 'bg-[#2D5A3D]/8 text-[#2D5A3D]', span: 'md:col-span-1' },
  { icon: Paintbrush, key: 'customizable', accent: 'bg-[#8F3D6B]/8 text-[#8F3D6B]', span: 'md:col-span-2' },
  { icon: Layers, key: 'unlimited', accent: 'bg-[#3D6B8F]/8 text-[#3D6B8F]', span: 'md:col-span-2' },
]

export async function Features() {
  const t = await getTranslations('features')

  return (
    <section id="features" className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header -- matching pricing pattern */}
        <div className="mb-10 lg:mb-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl shrink-0">
              {t('title')} <span className="text-accent">{t('titleAccent')}</span>
            </h2>
            <p className="text-sm text-muted sm:text-base sm:pb-1 leading-snug">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Feature grid -- varied sizes using col-span */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5">
          {featuresMeta.map(({ icon: Icon, key, accent, span }) => (
            <article
              key={key}
              className={cn(
                'group relative rounded-[var(--radius-lg)] border border-border-light bg-surface p-7 lg:p-8 transition-all duration-300 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
                span
              )}
            >
              <div
                className={cn(
                  'inline-flex items-center justify-center w-11 h-11 rounded-[var(--radius-md)] mb-5 transition-transform duration-300 group-hover:scale-105',
                  accent
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.8} />
              </div>

              <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-2">
                {t(`${key}.title`)}
              </h3>

              <p className="text-sm text-muted leading-relaxed">
                {t(`${key}.description`)}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
