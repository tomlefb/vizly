import type { ReactNode } from 'react'

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold mb-3">{title}</h2>
      <div className="text-sm text-muted leading-relaxed">{children}</div>
    </section>
  )
}
