import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-[var(--radius-xl)] bg-accent/10 mb-6">
        <span className="font-[family-name:var(--font-satoshi)] text-3xl font-extrabold text-accent">
          404
        </span>
      </div>
      <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight mb-2">
        Page introuvable
      </h1>
      <p className="text-sm text-muted max-w-xs leading-relaxed mb-8">
        La page que tu cherches n&apos;existe pas ou a ete deplacee.
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/"
          className="rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
        >
          Accueil
        </Link>
        <Link
          href="/templates"
          className="rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-warm"
        >
          Templates
        </Link>
        <Link
          href="/blog"
          className="rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors duration-200 hover:bg-surface-warm"
        >
          Blog
        </Link>
      </div>
    </div>
  )
}
