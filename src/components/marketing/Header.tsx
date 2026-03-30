'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Logo } from '@/components/shared/Logo'

const navLinks = [
  { label: 'Fonctionnalites', href: '/#features' },
  { label: 'Templates', href: '/templates' },
  { label: 'Tarifs', href: '/#pricing' },
  { label: 'Blog', href: '/blog' },
] as const

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8"
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <Link href="/" className="shrink-0" aria-label="Vizly - Accueil">
          <Logo size="md" />
        </Link>

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-5">
          <Link
            href="/login"
            className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            Creer mon portfolio
          </Link>
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-[var(--radius-sm)] p-2 text-foreground transition-colors hover:bg-surface-warm"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          'md:hidden overflow-hidden border-b border-border bg-background transition-all duration-300 ease-out',
          mobileOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
        aria-hidden={!mobileOpen}
      >
        <div className="px-6 pb-6 pt-2 space-y-4">
          <ul className="space-y-1">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="block rounded-[var(--radius-sm)] px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-warm"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="border-t border-border pt-4 space-y-3">
            <Link
              href="/login"
              className="block text-center rounded-[var(--radius-md)] border border-border px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-warm"
              onClick={() => setMobileOpen(false)}
            >
              Se connecter
            </Link>
            <Link
              href="/register"
              className="block text-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              onClick={() => setMobileOpen(false)}
            >
              Creer mon portfolio
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
