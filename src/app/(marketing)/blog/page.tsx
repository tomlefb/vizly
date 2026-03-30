import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/marketing/Header'
import { Footer } from '@/components/marketing/Footer'
import { BLOG_POSTS, formatBlogDate } from '@/lib/blog'

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Conseils pour creer un portfolio en ligne professionnel. Guides, tips et comparatifs.',
}

export default function BlogPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-7xl px-6 lg:px-8 py-16 lg:py-24">
        <div className="max-w-2xl mb-12">
          <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl">
            Blog
          </h1>
          <p className="mt-4 text-lg text-muted leading-relaxed">
            Guides, conseils et inspiration pour creer un portfolio qui te demarque.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {BLOG_POSTS.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group rounded-[var(--radius-xl)] border border-border bg-surface overflow-hidden transition-all duration-300 hover:border-accent/30 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]"
            >
              {/* Cover */}
              <div
                className="h-40 relative"
                style={{ backgroundColor: `${post.coverColor}10` }}
              >
                <div className="absolute inset-4 flex flex-col justify-end">
                  <div
                    className="h-3 w-3/4 rounded-sm mb-2"
                    style={{ backgroundColor: `${post.coverColor}20` }}
                  />
                  <div
                    className="h-2 w-1/2 rounded-sm"
                    style={{ backgroundColor: `${post.coverColor}15` }}
                  />
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                  <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
                  <span aria-hidden="true">&middot;</span>
                  <span>{post.readingTime} de lecture</span>
                </div>
                <h2 className="font-[family-name:var(--font-satoshi)] text-base font-semibold leading-snug group-hover:text-accent transition-colors duration-200">
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
      <Footer />
    </>
  )
}
