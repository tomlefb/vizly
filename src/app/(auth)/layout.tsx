import { VzLogo } from '@/components/ui/vizly'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-10 sm:py-14">
      <div className="mb-8">
        <VzLogo size={28} href="/" />
      </div>
      <div className="w-full max-w-[440px] rounded-[var(--radius-lg)] border border-border-light bg-surface p-7 sm:p-8 lg:p-10">
        {children}
      </div>
      <p className="mt-8 text-xs text-muted-foreground">
        &copy; {new Date().getFullYear()} Vizly. Tous droits réservés.
      </p>
    </div>
  )
}
