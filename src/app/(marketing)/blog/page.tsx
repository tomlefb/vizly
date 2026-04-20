import type { Metadata } from 'next'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { BLOG_POSTS, formatBlogDate } from '@/lib/blog'
import { VzHighlight } from '@/components/ui/vizly'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('blog.index')
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  }
}

export default async function BlogPage() {
  const t = await getTranslations('blog.index')
  return (
    <main className="mx-auto max-w-7xl px-6 lg:px-8 pt-10 lg:pt-16 pb-16 lg:pb-24">
        <div className="max-w-2xl mb-10">
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl leading-[1.08]">
            {t('titleStart')} <VzHighlight>{t('titleAccent')}</VzHighlight>
          </h1>
          <p className="mt-3 text-lg text-muted leading-relaxed">
            {t('description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[var(--radius-lg)] border border-border-light bg-surface overflow-hidden transition-all duration-300 hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]"
            >
              {/* Cover illustration */}
              <div
                className="h-44 relative overflow-hidden border-b border-border-light"
                style={{ backgroundColor: `${post.coverColor}0A` }}
              >
                <div className="absolute top-3 left-3">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[var(--radius-sm)]"
                    style={{
                      color: post.coverColor,
                      backgroundColor: `${post.coverColor}18`,
                    }}
                  >
                    {post.readingTime}
                  </span>
                </div>
                <BlogCover slug={post.slug} color={post.coverColor} />
              </div>

              {/* Content */}
              <div className="p-5">
                <time
                  dateTime={post.date}
                  className="text-xs text-muted-foreground"
                >
                  {formatBlogDate(post.date)}
                </time>
                <h2 className="mt-2 font-[family-name:var(--font-satoshi)] text-base font-semibold leading-snug group-hover:text-accent-deep transition-colors duration-150">
                  {post.title}
                </h2>
                <p className="mt-2 text-sm text-muted leading-relaxed line-clamp-2">
                  {post.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
    </main>
  )
}

/* ------------------------------------------------------------------ */
/*  Mini-illustrations par article (mockups HTML/CSS)                  */
/* ------------------------------------------------------------------ */

function BlogCover({ slug, color }: { slug: string; color: string }) {
  const bg = (hex: string) => ({ backgroundColor: `${color}${hex}` })
  const bd = (hex: string) => ({ borderColor: `${color}${hex}` })

  switch (slug) {
    /* ---- Browser mockup → portfolio ---- */
    case 'creer-portfolio-en-ligne-5-minutes':
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 pt-10">
          <div className="w-48 rounded-lg overflow-hidden border" style={bd('25')}>
            <div className="h-5 flex items-center gap-1 px-2" style={bg('0C')}>
              <span className="h-1.5 w-1.5 rounded-full" style={bg('35')} />
              <span className="h-1.5 w-1.5 rounded-full" style={bg('20')} />
              <span className="h-1.5 w-1.5 rounded-full" style={bg('20')} />
              <span className="ml-2 h-2 flex-1 rounded-full" style={bg('10')} />
            </div>
            <div className="p-3 space-y-2 bg-surface/60">
              <div className="flex items-center gap-2">
                <span className="h-7 w-7 shrink-0 rounded-full" style={bg('22')} />
                <div className="flex-1 space-y-1">
                  <span className="block h-1.5 w-16 rounded-full" style={bg('1A')} />
                  <span className="block h-1.5 w-10 rounded-full" style={bg('10')} />
                </div>
              </div>
              <span className="block h-1.5 w-full rounded-full" style={bg('0A')} />
              <span className="block h-1.5 w-3/4 rounded-full" style={bg('0A')} />
              <div className="flex gap-1.5 pt-1">
                <span className="h-10 flex-1 rounded" style={bg('0C')} />
                <span className="h-10 flex-1 rounded" style={bg('0C')} />
              </div>
            </div>
          </div>
        </div>
      )

    /* ---- Code editor with error lines ---- */
    case 'portfolio-developpeur-erreurs':
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 pt-10">
          <div className="w-52 rounded-lg overflow-hidden border" style={bd('25')}>
            <div className="h-5 flex items-center justify-between px-2" style={bg('0C')}>
              <div className="flex gap-1">
                <span className="h-1.5 w-1.5 rounded-full" style={bg('35')} />
                <span className="h-1.5 w-1.5 rounded-full" style={bg('20')} />
                <span className="h-1.5 w-1.5 rounded-full" style={bg('20')} />
              </div>
              <span className="h-2 w-16 rounded-full" style={bg('10')} />
            </div>
            <div className="p-2.5 space-y-1.5 bg-surface/60">
              {[
                { w: 'w-20', err: false },
                { w: 'w-28', err: false },
                { w: 'w-24', err: true },
                { w: 'w-16', err: false },
                { w: 'w-32', err: true },
                { w: 'w-20', err: false },
                { w: 'w-12', err: false },
              ].map((line, i) => (
                <div
                  key={i}
                  className={`flex gap-2 items-center px-1 py-0.5 rounded ${line.err ? 'bg-destructive/[0.06]' : ''}`}
                >
                  <span
                    className={`h-1.5 w-3 shrink-0 rounded-sm ${line.err ? 'bg-destructive/20' : ''}`}
                    style={line.err ? undefined : bg('15')}
                  />
                  <span
                    className={`h-1.5 ${line.w} rounded-sm ${line.err ? 'bg-destructive/15' : ''}`}
                    style={line.err ? undefined : bg('12')}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )

    /* ---- 2×2 template grid ---- */
    case 'quel-template-choisir':
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 pt-10">
          <div className="grid grid-cols-2 gap-2 w-44">
            {[false, true, true, false].map((alt, i) => (
              <div key={i} className="rounded-md overflow-hidden border" style={bd('20')}>
                <div className="h-3" style={bg(alt ? '10' : '18')} />
                <div className="p-1.5 space-y-1 bg-surface/60">
                  {alt ? (
                    <>
                      <span className="block h-4 w-4 rounded-full mx-auto" style={bg('15')} />
                      <span className="block h-1 w-full rounded-full" style={bg('0C')} />
                    </>
                  ) : (
                    <>
                      <span className="block h-1 w-full rounded-full" style={bg('12')} />
                      <span className="block h-1 w-2/3 rounded-full" style={bg('0A')} />
                      <span className="block h-5 w-full rounded-sm" style={bg('08')} />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )

    /* ---- CV / resume mockup ---- */
    case 'portfolio-etudiant-stage-alternance':
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 pt-10">
          <div className="w-36 rounded-lg overflow-hidden border bg-surface/60" style={bd('25')}>
            <div className="p-3 space-y-2.5">
              <div className="flex items-center gap-2">
                <span className="h-8 w-8 shrink-0 rounded-full" style={bg('20')} />
                <div className="flex-1 space-y-1">
                  <span className="block h-2 w-14 rounded-full" style={bg('22')} />
                  <span className="block h-1.5 w-10 rounded-full" style={bg('10')} />
                </div>
              </div>
              <span className="block h-px w-full" style={bg('12')} />
              <div className="space-y-1">
                <span className="block h-1.5 w-10 rounded-full" style={bg('22')} />
                <span className="block h-1 w-full rounded-full" style={bg('0A')} />
                <span className="block h-1 w-full rounded-full" style={bg('0A')} />
                <span className="block h-1 w-3/4 rounded-full" style={bg('0A')} />
              </div>
              <div className="space-y-1">
                <span className="block h-1.5 w-12 rounded-full" style={bg('22')} />
                <div className="flex gap-1">
                  <span className="h-3.5 flex-1 rounded" style={bg('0C')} />
                  <span className="h-3.5 flex-1 rounded" style={bg('0C')} />
                  <span className="h-3.5 flex-1 rounded" style={bg('0C')} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )

    /* ---- Bar chart comparison ---- */
    case 'comparatif-outils-portfolio-2026':
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6 pt-10">
          <div className="w-48">
            <div className="flex items-end gap-2.5 h-24">
              {[55, 40, 70, 48, 88].map((h, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t-sm"
                  style={{
                    height: `${h}%`,
                    backgroundColor: `${color}${i === 4 ? '38' : String(14 + i * 4)}`,
                  }}
                />
              ))}
            </div>
            <span className="block mt-2 h-px w-full" style={bg('15')} />
            <div className="flex gap-2.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className="flex-1 h-1.5 rounded-full" style={bg('10')} />
              ))}
            </div>
          </div>
        </div>
      )

    default:
      return null
  }
}
