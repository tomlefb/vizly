import type { Metadata } from 'next'
import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'
import { Zap, AlertTriangle, LayoutGrid, GraduationCap, BarChart3 } from 'lucide-react'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { BLOG_POSTS, formatBlogDate } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Conseils pour creer un portfolio en ligne professionnel. Guides, tips et comparatifs.',
}

const coverIcons: Record<string, LucideIcon> = {
  'creer-portfolio-en-ligne-5-minutes': Zap,
  'portfolio-developpeur-erreurs': AlertTriangle,
  'quel-template-choisir': LayoutGrid,
  'portfolio-etudiant-stage-alternance': GraduationCap,
  'comparatif-outils-portfolio-2026': BarChart3,
}

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 lg:px-8 pt-10 lg:pt-16 pb-16 lg:pb-24">
        <div className="max-w-2xl mb-10">
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl">
            Blog
          </h1>
          <p className="mt-3 text-lg text-muted leading-relaxed">
            Guides, conseils et inspiration pour creer un portfolio qui te demarque.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => {
            const Icon = coverIcons[post.slug]

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden transition-all duration-200 hover:border-border-light hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
              >
                {/* Cover */}
                <div
                  className="h-44 relative overflow-hidden"
                  style={{ backgroundColor: `${post.coverColor}0C` }}
                >
                  <div
                    className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full"
                    style={{ backgroundColor: `${post.coverColor}10` }}
                  />
                  <div
                    className="absolute -left-4 -top-4 h-20 w-20 rounded-full"
                    style={{ backgroundColor: `${post.coverColor}08` }}
                  />
                  {Icon && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Icon
                        className="h-14 w-14 transition-transform duration-200 group-hover:scale-105"
                        style={{ color: `${post.coverColor}30` }}
                        strokeWidth={1.2}
                      />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-[var(--radius-sm)]"
                      style={{
                        color: post.coverColor,
                        backgroundColor: `${post.coverColor}15`,
                      }}
                    >
                      {post.readingTime}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <time
                    dateTime={post.date}
                    className="text-xs text-muted-foreground"
                  >
                    {formatBlogDate(post.date)}
                  </time>
                  <h2 className="mt-2 font-[family-name:var(--font-satoshi)] text-base font-semibold leading-snug group-hover:text-accent transition-colors duration-150">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                    {post.description}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
      <Footer />
    </>
  )
}
