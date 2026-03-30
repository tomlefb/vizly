import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  const { data: profile } = await supabase
    .from('users')
    .select('name, plan')
    .eq('id', user.id)
    .single()

  return (
    <>
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight">
          Mon Portfolio
        </h1>
        <p className="mt-1 text-muted">
          {profile?.name ? `Bienvenue, ${profile.name}` : 'Bienvenue sur Vizly'}
        </p>
      </div>

      {portfolio ? (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Portfolio info */}
          <div className="lg:col-span-3 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-[family-name:var(--font-satoshi)] text-xl font-semibold">
                  {portfolio.title || 'Sans titre'}
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Template : {portfolio.template}
                </p>
                {portfolio.slug && (
                  <p className="mt-1 text-sm text-muted">
                    URL :{' '}
                    <span className="font-medium text-foreground">
                      {portfolio.slug}.vizly.fr
                    </span>
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    portfolio.published
                      ? 'bg-success/10 text-success'
                      : 'bg-surface-warm text-muted'
                  }`}
                >
                  {portfolio.published ? 'En ligne' : 'Brouillon'}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/editor"
                className="inline-flex items-center rounded-[var(--radius-md)] bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
              >
                Modifier
              </Link>
              {portfolio.published && portfolio.slug && (
                <a
                  href={`https://${portfolio.slug}.vizly.fr`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] border border-border px-4 py-2 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm"
                >
                  Voir le site
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                    />
                  </svg>
                </a>
              )}
            </div>
          </div>

          {/* Portfolio preview card */}
          <div className="lg:col-span-2">
            {portfolio.published && portfolio.slug ? (
              <a
                href={`https://${portfolio.slug}.vizly.fr`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-[var(--radius-lg)] border border-border bg-surface overflow-hidden transition-shadow duration-200 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)] hover:border-accent/30 group"
              >
                {/* Browser chrome */}
                <div className="flex items-center gap-2 border-b border-border bg-surface-warm px-3 py-2">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#FF6259]" />
                    <span className="w-2 h-2 rounded-full bg-[#FFBF2F]" />
                    <span className="w-2 h-2 rounded-full bg-[#29CE42]" />
                  </div>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="rounded-[3px] bg-background border border-border-light px-2.5 py-0.5 text-[10px] text-muted font-mono truncate max-w-[160px]">
                      {portfolio.slug}.vizly.fr
                    </div>
                  </div>
                </div>
                {/* Mini preview body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    {portfolio.photo_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={portfolio.photo_url}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ backgroundColor: portfolio.primary_color || '#E8553D' }}
                      >
                        {(portfolio.title || 'V')[0]?.toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {portfolio.title || 'Mon portfolio'}
                      </div>
                      <div className="text-[10px] text-muted capitalize">
                        {portfolio.template}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="h-10 rounded-[var(--radius-sm)]" style={{ backgroundColor: `${portfolio.primary_color || '#E8553D'}12` }} />
                    <div className="h-14 rounded-[var(--radius-sm)]" style={{ backgroundColor: `${portfolio.primary_color || '#E8553D'}08` }} />
                    <div className="h-14 rounded-[var(--radius-sm)]" style={{ backgroundColor: `${portfolio.primary_color || '#E8553D'}08` }} />
                    <div className="h-10 rounded-[var(--radius-sm)]" style={{ backgroundColor: `${portfolio.primary_color || '#E8553D'}12` }} />
                  </div>
                  <p className="text-[10px] text-center text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    Ouvrir le portfolio &rarr;
                  </p>
                </div>
              </a>
            ) : (
              <div className="rounded-[var(--radius-lg)] border border-dashed border-border bg-surface-warm/50 p-6 flex flex-col items-center justify-center text-center h-full min-h-[180px]">
                <div className="w-10 h-10 rounded-full bg-surface-warm border border-border flex items-center justify-center mb-3">
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-xs text-muted leading-relaxed">
                  Publie ton portfolio pour voir l&apos;apercu ici
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-border py-16 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
            <svg
              className="h-7 w-7 text-accent"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
          </div>
          <h2 className="font-[family-name:var(--font-satoshi)] text-xl font-semibold">
            {profile?.name ? `${profile.name}, cree ton portfolio` : 'Cree ton premier portfolio'}
          </h2>
          <p className="mt-2 max-w-sm text-sm text-muted leading-relaxed">
            En 5 minutes chrono. Remplis tes infos, choisis un template,
            et ton site est en ligne sur pseudo.vizly.fr.
          </p>
          <Link
            href="/editor"
            className="mt-6 inline-flex items-center rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
          >
            Créer mon portfolio
          </Link>
        </div>
      )}

      {/* Plan info */}
      <div className="mt-8 rounded-[var(--radius-lg)] border border-border bg-surface p-6">
        <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold">
          Mon plan
        </h3>
        <p className="mt-1 text-sm text-muted">
          Plan actuel :{' '}
          <span className="font-medium capitalize text-foreground">
            {profile?.plan ?? 'free'}
          </span>
        </p>
        {profile?.plan === 'free' && (
          <Link
            href="/billing"
            className="mt-4 inline-flex items-center text-sm font-medium text-accent transition-colors duration-150 hover:text-accent-hover"
          >
            Passer au plan Starter pour publier ton portfolio
            <svg
              className="ml-1 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
              />
            </svg>
          </Link>
        )}
      </div>
    </>
  )
}
