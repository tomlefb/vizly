'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { HeroPortfolioWall } from './HeroPortfolioWall'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'

const easeOut = [0, 0, 0.2, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, delay, ease: easeOut },
  }),
}

export function Hero() {
  const t = useTranslations('hero')

  return (
    <section className="relative overflow-hidden h-dvh min-h-[640px] pt-20">
      {/* Scrolling portfolio wall -- right half, behind text on mobile */}
      <HeroPortfolioWall />

      <div className="relative z-2 h-full flex flex-col justify-center pb-[10vh] pl-[clamp(1.5rem,7.78vw,20rem)] pr-6 lg:pr-8">
        <div className="max-w-xl md:max-w-[min(38.82vw,80rem)] space-y-8">
          <motion.h1
            className="font-[family-name:var(--font-satoshi)] text-balance text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-[clamp(4.25rem,4.72vw,9.5rem)]"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            {t.rich('titleRich', {
              highlight: (chunks) => <VzHighlight>{chunks}</VzHighlight>,
            })}
          </motion.h1>

          <motion.p
            className="max-w-[55ch] text-lg leading-relaxed text-muted sm:text-[clamp(1.25rem,1.39vw,1.75rem)]"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.05}
          >
            {t('description', { domain: 'pseudo.vizly.fr' })}
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            <Link
              href="/register"
              className={vzBtnClasses({
                variant: 'primary',
                size: 'lg',
                className: 'group',
              })}
            >
              {t('cta')}
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/templates"
              className={vzBtnClasses({
                variant: 'secondary',
                size: 'lg',
              })}
            >
              {t('secondary')}
            </Link>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.15}
          >
            {t('socialProof')}
          </motion.p>
        </div>
      </div>
    </section>
  )
}
