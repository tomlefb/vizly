'use client'

import { useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

export function FAQAccordion() {
  const t = useTranslations('faq')
  const items = t.raw('items') as Array<{ q: string; a: string; section?: string }>
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggle = useCallback((i: number) => {
    setOpenIndex((prev) => (prev === i ? null : i))
  }, [])

  return (
    <div className="divide-y divide-border-light" role="list">
      {items.map((item, i) => (
        <div key={i} role="listitem">
          <button
            type="button"
            onClick={() => toggle(i)}
            className="flex w-full items-center justify-between py-5 text-left transition-colors duration-150 hover:text-accent-deep"
            aria-expanded={openIndex === i}
            aria-controls={`faq-answer-${i}`}
          >
            <span className="text-sm font-semibold text-foreground pr-4">
              {item.q}
            </span>
            <ChevronDown
              className={cn(
                'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
                openIndex === i && 'rotate-180'
              )}
            />
          </button>
          <div
            id={`faq-answer-${i}`}
            className={cn(
              'overflow-hidden transition-all duration-200',
              openIndex === i ? 'max-h-96 pb-5' : 'max-h-0'
            )}
            role="region"
            aria-hidden={openIndex !== i}
          >
            <p className="text-sm text-muted leading-relaxed">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
