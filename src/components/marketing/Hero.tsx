'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'

const easeOut = [0, 0, 0.2, 1] as const

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: easeOut },
  }),
}

const mockProjects = [
  { title: 'Brand Identity', color: '#D4634E', height: 'h-32' },
  { title: 'App Design', color: '#2D5A3D', height: 'h-44' },
  { title: 'Photography', color: '#8B6914', height: 'h-36' },
  { title: 'Web Dev', color: '#4A3D8F', height: 'h-28' },
]

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text content -- takes 7 cols for asymmetry */}
          <div className="lg:col-span-7 space-y-8">
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

          {/* Visual -- mock portfolio preview, takes 5 cols */}
          <motion.div
            className="lg:col-span-5 relative"
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: easeOut }}
          >
            <div className="relative">
              {/* Browser chrome */}
              <div className="rounded-t-[var(--radius-lg)] border border-border border-b-0 bg-surface-warm px-4 py-3 flex items-center gap-2">
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FF6259]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#FFBF2F]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#29CE42]" />
                </div>
                <div className="flex-1 mx-8">
                  <div className="mx-auto max-w-xs rounded-[var(--radius-sm)] bg-background border border-border-light px-3 py-1 text-[11px] text-muted text-center font-mono">
                    marie.vizly.fr
                  </div>
                </div>
              </div>

              {/* Mock portfolio content */}
              <div className="rounded-b-[var(--radius-lg)] border border-border bg-surface p-6 space-y-5">
                {/* Mock header */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-lg font-bold text-accent font-[family-name:var(--font-satoshi)]">M</span>
                  </div>
                  <div className="space-y-1">
                    <div className="h-3.5 w-28 rounded-sm bg-foreground/10" />
                    <div className="h-2.5 w-20 rounded-sm bg-foreground/5" />
                  </div>
                </div>

                {/* Mock project grid -- masonry style with varied heights */}
                <div className="grid grid-cols-2 gap-3">
                  {mockProjects.map((project, i) => (
                    <motion.div
                      key={project.title}
                      className={`${project.height} rounded-[var(--radius-md)] relative overflow-hidden`}
                      style={{ backgroundColor: `${project.color}12` }}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.4,
                        delay: 0.5 + i * 0.08,
                        ease: easeOut,
                      }}
                    >
                      <div className="absolute inset-x-0 bottom-0 p-2.5">
                        <div
                          className="h-2 rounded-sm w-2/3"
                          style={{ backgroundColor: `${project.color}25` }}
                        />
                        <div
                          className="h-1.5 rounded-sm w-1/3 mt-1.5"
                          style={{ backgroundColor: `${project.color}15` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Mock social links */}
                <div className="flex gap-2 pt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full bg-foreground/5"
                    />
                  ))}
                </div>
              </div>

              {/* Decorative floating elements */}
              <motion.div
                className="absolute -top-4 -right-4 w-20 h-20 rounded-full bg-accent/5 blur-xl"
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                aria-hidden="true"
              />
              <motion.div
                className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-accent/5 blur-2xl"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{
                  duration: 5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: 1,
                }}
                aria-hidden="true"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
