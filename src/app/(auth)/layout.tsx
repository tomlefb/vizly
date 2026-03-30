import { Logo } from '@/components/shared/Logo'
import Link from 'next/link'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="mb-10" aria-label="Retour à l'accueil">
        <Logo size="lg" />
      </Link>
      <div className="w-full max-w-[400px]">{children}</div>
      <p className="mt-10 text-sm text-muted">
        &copy; {new Date().getFullYear()} Vizly. Tous droits réservés.
      </p>
    </div>
  )
}
