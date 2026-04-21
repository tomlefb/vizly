'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { sanitizeHtml } from '@/lib/sanitize'
import { KpiRenderer } from './KpiRenderer'
import type { LayoutBlock } from '@/types/layout-blocks'

interface LayoutBlockRendererProps {
  block: LayoutBlock
  primaryColor: string
  dark?: boolean
}

export function LayoutBlockRenderer({ block, primaryColor, dark = false }: LayoutBlockRendererProps) {
  const mutedColor = dark ? '#888' : '#6B6B6B'

  return (
    <div
      className={cn(
        'grid gap-6',
        block.columnCount === 1 && 'grid-cols-1',
        block.columnCount === 2 && 'grid-cols-1 md:grid-cols-2',
        block.columnCount === 3 && 'grid-cols-1 md:grid-cols-3',
      )}
    >
      {block.columns.slice(0, block.columnCount).map((col, i) => {
        if (col.type === 'empty') return <div key={i} />

        if (col.type === 'text') {
          return (
            <div key={i}>
              {col.title && (
                <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: dark ? '#E8E8E8' : '#1A1A1A', marginBottom: 8 }}>
                  {col.title}
                </h3>
              )}
              {col.content && (
                <div
                  style={{ fontSize: '0.92rem', lineHeight: 1.7, color: mutedColor }}
                  className="[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2 [&_b]:font-bold [&_i]:italic"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(col.content) }}
                />
              )}
            </div>
          )
        }

        if (col.type === 'kpi' && col.kpi) {
          return (
            <div key={i}>
              <KpiRenderer kpi={col.kpi} primaryColor={primaryColor} dark={dark} />
            </div>
          )
        }

        if (col.type === 'image' && col.imageUrl) {
          return (
            <div key={i} className="relative overflow-hidden rounded-lg" style={{ aspectRatio: '16/10' }}>
              <Image src={col.imageUrl} alt={col.imageAlt ?? ''} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
          )
        }

        return <div key={i} />
      })}
    </div>
  )
}
