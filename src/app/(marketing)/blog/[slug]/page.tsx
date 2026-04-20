import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'
import { BLOG_POSTS, getPost, formatBlogDate } from '@/lib/blog'
import { getArticleContent } from '@/lib/blog-content'
import { VzHighlight, vzBtnClasses } from '@/components/ui/vizly'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return {
    title: post.title,
    description: post.description,
    openGraph: { title: post.title, description: post.description, type: 'article' },
  }
}

export default async function BlogArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  const content = getArticleContent(slug)
  const t = await getTranslations('blog.article')

  return (
    <main className="mx-auto max-w-3xl px-6 lg:px-8 py-16 lg:py-24">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('back')}
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
            <span aria-hidden="true">&middot;</span>
            <span>{t('readingTime', { time: post.readingTime })}</span>
          </div>
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl leading-[1.1]">
            {post.title}
          </h1>
          <p className="mt-4 text-lg text-muted leading-relaxed">
            {post.description}
          </p>
        </div>

        {/* Article body */}
        <article className="space-y-6 text-sm text-foreground leading-relaxed">
          {content.map((block, i) => {
            if (block.type === 'h2') {
              return (
                <h2
                  key={i}
                  className="font-[family-name:var(--font-satoshi)] text-xl font-semibold mt-10 mb-4"
                >
                  {block.text}
                </h2>
              )
            }
            if (block.type === 'cta') {
              return (
                <div
                  key={i}
                  className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-6 text-center my-8"
                >
                  <p className="text-base font-semibold text-foreground mb-4">
                    {block.text}
                  </p>
                  <Link
                    href="/register"
                    className={vzBtnClasses({ variant: 'primary', size: 'md' })}
                  >
                    {t('inlineCta')}
                  </Link>
                </div>
              )
            }
            return (
              <p key={i}>{block.text}</p>
            )
          })}
        </article>

        {/* Bottom CTA */}
        <div className="mt-16 rounded-[var(--radius-xl)] border border-border-light bg-surface p-8 sm:p-10 text-center">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold text-foreground mb-3 leading-[1.1]">
            {t('ctaTitleStart')} <VzHighlight>{t('ctaTitleAccent')}</VzHighlight> {t('ctaTitleEnd')}
          </h2>
          <p className="text-muted mb-6 text-sm">
            {t('ctaDescription')}
          </p>
          <Link
            href="/register"
            className={vzBtnClasses({ variant: 'primary', size: 'lg' })}
          >
            {t('ctaPrimary')}
          </Link>
        </div>
    </main>
  )
}
