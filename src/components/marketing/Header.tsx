'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { VzLogo, vzBtnClasses } from '@/components/ui/vizly'
import { createClient } from '@/lib/supabase/client'

export function Header() {
  const t = useTranslations('nav')
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authReady, setAuthReady] = useState(false)

  const navLinks = [
    { label: t('home'), href: '/' },
    { label: t('features'), href: '/fonctionnalites' },
    { label: t('templates'), href: '/templates' },
    { label: t('pricing'), href: '/tarifs' },
    { label: t('showcase'), href: '/exemples' },
    { label: t('blog'), href: '/blog' },
  ]

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsLoggedIn(!!user)
      setAuthReady(true)
    })
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border-light">
      <nav
        className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8"
        aria-label="Navigation principale"
      >
        {/* Logo */}
        <VzLogo href="/" size={22} />

        {/* Desktop nav */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onMouseEnter={() => router.prefetch(link.href)}
                className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-5">
          {!authReady ? (
            <div className="w-[140px]" />
          ) : isLoggedIn ? (
            <Link
              href="/dashboard"
              className={vzBtnClasses({ variant: 'primary', size: 'sm' })}
            >
              {t('dashboard')}
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted transition-colors duration-200 hover:text-foreground"
              >
                {t('login')}
              </Link>
              <Link
                href="/register"
                className={vzBtnClasses({ variant: 'primary', size: 'sm' })}
              >
                {t('register')}
              </Link>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          className="md:hidden inline-flex items-center justify-center rounded-[var(--radius-sm)] p-2 text-foreground transition-colors hover:bg-surface-warm"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-expanded={mobileOpen}
          aria-controls="mobile-menu"
          aria-label={mobileOpen ? t('closeMenu') : t('openMenu')}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-menu"
        className={cn(
          'md:hidden overflow-y-auto border-b border-border-light bg-background transition-all duration-300 ease-out',
          mobileOpen ? 'max-h-[calc(100dvh-4rem)] opacity-100' : 'max-h-0 opacity-0'
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

          <div className="border-t border-border-light pt-4 space-y-3">
            {!authReady ? (
              <div className="h-10" />
            ) : isLoggedIn ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileOpen(false)}
                className={vzBtnClasses({
                  variant: 'primary',
                  size: 'md',
                  className: 'w-full',
                })}
              >
                {t('dashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMobileOpen(false)}
                  className={vzBtnClasses({
                    variant: 'secondary',
                    size: 'md',
                    className: 'w-full',
                  })}
                >
                  {t('login')}
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileOpen(false)}
                  className={vzBtnClasses({
                    variant: 'primary',
                    size: 'md',
                    className: 'w-full',
                  })}
                >
                  {t('register')}
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
