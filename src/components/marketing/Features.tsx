import {
  ClipboardList,
  Palette,
  Zap,
  Paintbrush,
  Layers,
} from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { VzHighlight } from '@/components/ui/vizly'
import type { LucideIcon } from 'lucide-react'

interface FeatureItem {
  icon: LucideIcon
  key: string
  span: string
}

const featuresMeta: FeatureItem[] = [
  { icon: Zap, key: 'live', span: 'md:col-span-2' },
  { icon: ClipboardList, key: 'form', span: 'md:col-span-1' },
  { icon: Palette, key: 'templates', span: 'md:col-span-1' },
  { icon: Paintbrush, key: 'customizable', span: 'md:col-span-2' },
  { icon: Layers, key: 'unlimited', span: 'md:col-span-2' },
]

export async function Features() {
  const t = await getTranslations('features')

  return (
    <section id="features" className="py-12 sm:py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 sm:mb-10 lg:mb-14">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-4">
            <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl shrink-0 leading-[1.08]">
              {t('title')} <VzHighlight>{t('titleAccent')}</VzHighlight>
            </h2>
            <p className="text-sm text-muted sm:text-base sm:pb-1 leading-snug">
              {t('subtitle')}
            </p>
          </div>
        </div>

        {/* Feature grid -- Handcrafted: icônes simples text-muted, pas de cercle coloré */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 lg:gap-5">
          {featuresMeta.map(({ icon: Icon, key, span }) => (
            <article
              key={key}
              className={cn(
                'group rounded-[var(--radius-lg)] border border-border-light bg-surface p-5 sm:p-7 lg:p-8 transition-all duration-300 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
                span
              )}
            >
              <div className="mb-5">
                <Icon className="h-6 w-6 text-muted" strokeWidth={1.5} />
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
