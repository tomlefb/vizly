import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { BLOG_POSTS, getPost, formatBlogDate } from '@/lib/blog'
import { getArticleContent } from '@/lib/blog-content'

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

  return (
    <>
      <Header />
      <main className="mx-auto max-w-3xl px-6 lg:px-8 py-16 lg:py-24">
        {/* Back link */}
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors duration-200 mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour au blog
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
            <span aria-hidden="true">&middot;</span>
            <span>{post.readingTime} de lecture</span>
          </div>
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
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
                  className="rounded-[var(--radius-lg)] border border-accent/20 bg-accent/5 p-6 text-center my-8"
                >
                  <p className="text-base font-semibold text-foreground mb-2">
                    {block.text}
                  </p>
                  <Link
                    href="/register"
                    className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
                  >
                    Creer mon portfolio gratuitement
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
        <div className="mt-16 rounded-[var(--radius-xl)] bg-foreground p-8 sm:p-10 text-center">
          <h2 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold text-background mb-3">
            Prêt à créer ton portfolio ?
          </h2>
          <p className="text-background/60 mb-6 text-sm">
            Gratuit pour commencer. Publication a partir de 4,99 EUR/mois.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-accent-hover"
          >
            Commencer gratuitement
          </Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
