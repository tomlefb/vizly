'use client'

export function DashboardContent({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh bg-surface-warm lg:pl-[60px]">
      <div className="mx-auto max-w-5xl px-8 py-10">{children}</div>
    </main>
  )
}
