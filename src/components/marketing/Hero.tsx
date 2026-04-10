'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
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
  return (
    <section className="relative overflow-hidden pt-12 pb-24 lg:pt-20 lg:pb-32 min-h-[520px] lg:min-h-[600px]">
      {/* Scrolling portfolio wall -- right half, behind text on mobile */}
      <HeroPortfolioWall />

      <div className="relative z-2 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-xl md:max-w-[46%] space-y-8">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3.5 py-1.5 text-xs font-semibold text-accent tracking-wide">
              <Sparkles className="h-3.5 w-3.5" />
              100% gratuit pour commencer
            </span>
          </motion.div>

          <motion.h1
            className="font-[family-name:var(--font-satoshi)] text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl xl:text-[4.25rem]"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
          >
            Cree ton portfolio{' '}
            <span className="relative">
              <span className="relative z-10">en 5 minutes</span>
              <span
                className="absolute -bottom-1 left-0 right-0 h-3 bg-accent/15 rounded-sm -z-0"
                aria-hidden="true"
              />
            </span>
          </motion.h1>

          <motion.p
            className="max-w-xl text-lg leading-relaxed text-muted sm:text-xl"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
          >
            Remplis un formulaire, choisis un template, et ton site portfolio est
            live sur{' '}
            <span className="font-medium text-foreground">pseudo.vizly.fr</span>.
            Aucune competence technique requise.
          </motion.p>

          <motion.div
            className="flex flex-wrap gap-4"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.3}
          >
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-7 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover hover:gap-3"
            >
              Commencer gratuitement
              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-border px-7 py-3.5 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-surface-warm"
            >
              Voir les templates
            </Link>
          </motion.div>

          <motion.p
            className="text-xs text-muted-foreground"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.4}
          >
            Deja 2 000+ portfolios crees &middot; Aucune carte bancaire requise
          </motion.p>
        </div>
      </div>
    </section>
  )
}
