'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { HeroPortfolioWall } from './HeroPortfolioWall'

const easeOut = [0, 0, 0.2, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: easeOut },
  }),
}

export function Hero() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden pt-20 pb-32 lg:pt-32 lg:pb-40 min-h-[560px] lg:min-h-[660px]">
      {/* Scrolling portfolio wall -- right half, behind text on mobile */}
      <HeroPortfolioWall />

      <div className="relative z-2 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-xl md:max-w-[46%] space-y-8">
          <motion.h1
            className="font-[family-name:var(--font-satoshi)] text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            {t('titleStart')}{' '}
            <span className="text-accent">{t('titleHighlight')}</span>
          </motion.h1>

          <motion.p
            className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            {t('description', { domain: 'pseudo.vizly.fr' })}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover hover:gap-3"
            >
              {t('cta')}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-warm"
            >
              {t('secondary')}
            </Link>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            {t('socialProof')}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
