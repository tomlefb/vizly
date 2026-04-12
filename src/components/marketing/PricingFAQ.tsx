'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { ScrollReveal, StaggerItem } from '@/components/shared/ScrollReveal'

interface FaqItem {
  q: string
  a: string
  section?: string
}

function AccordionItem({
  item,
  index,
}: {
  item: FaqItem
  index: number
}) {
  const [open, setOpen] = useState(false)

  return (
    <StaggerItem index={index}>
      <div className="border-b border-border">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between py-5 text-left"
          aria-expanded={open}
        >
          <span className="text-sm font-medium text-foreground pr-4">
            {item.q}
          </span>
          <ChevronDown
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-150',
              open && 'rotate-180'
            )}
            strokeWidth={1.5}
          />
        </button>
        <div
          className={cn(
            'overflow-hidden transition-all duration-150',
            open ? 'max-h-96 pb-5' : 'max-h-0'
          )}
        >
          <p className="text-sm text-muted leading-relaxed pr-8">
            {item.a}
          </p>
        </div>
      </div>
    </StaggerItem>
  )
}

export function PricingFAQ() {
  const t = useTranslations('pricingFaq')
  const tFaq = useTranslations('faq')
  const allItems = tFaq.raw('items') as FaqItem[]
  const pricingItems = allItems.filter((item) => item.section === 'pricing')

  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 lg:px-8">
        <ScrollReveal className="mb-10 lg:mb-14">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight sm:text-3xl">
            {t('title')} <span className="text-accent">{t('titleAccent')}</span>
          </h2>
          <p className="mt-3 text-muted leading-relaxed">
            {t('subtitle')}
          </p>
        </ScrollReveal>

        <div>
          {pricingItems.map((item, i) => (
            <AccordionItem key={i} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}
