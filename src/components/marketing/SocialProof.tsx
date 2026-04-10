import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Stats                                                              */
/* ------------------------------------------------------------------ */

const STATS = [
  { value: '2k', suffix: '+', label: 'portfolios crees et publies' },
  { value: '4', suffix: 'min', label: 'temps moyen pour etre live' },
  { value: '8', suffix: '', label: 'templates designes par des pros' },
  { value: '0', suffix: '\u202F€', label: 'pour commencer, sans CB requise' },
] as const

/* ------------------------------------------------------------------ */
/*  Testimonials                                                       */
/*  TODO: remplacer par de vrais avis (DB ou CMS)                     */
/* ------------------------------------------------------------------ */

const TESTIMONIALS = [
  {
    text: 'J\'avais procrastine mon portfolio pendant deux ans. Avec Vizly c\'etait regle en une apres-midi.',
    highlight: 'regle en une apres-midi',
    name: 'Lucas Martin',
    role: 'Designer UI/UX',
    city: 'Paris',
    initials: 'LM',
    color: '#D4634E',
  },
  {
    text: 'Mes clients me demandent tout le temps comment j\'ai fait mon site. Je leur dis Vizly, ils sont surpris.',
    highlight: 'ils sont surpris',
    name: 'Sara Kovac',
    role: 'Dev Front-end',
    city: 'Lyon',
    initials: 'SK',
    color: '#4A3D8F',
  },
  {
    text: 'Mon portfolio est passe de "je l\'envoie jamais" a "je le mets partout". Ca change vraiment pour trouver des missions.',
    highlight: 'je le mets partout',
    name: 'Nina Petit',
    role: 'Illustratrice',
    city: 'Toulouse',
    initials: 'NP',
    color: '#2D5A3D',
  },
] as const

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function SocialProof() {
  return (
    <section className="py-16 lg:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">

        {/* ── Stats row ─────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <div
              key={stat.label}
              className={`py-6 md:py-0 md:px-8 ${
                i > 0 ? 'border-l-[0.5px] border-border' : ''
              } ${i >= 2 ? 'max-md:border-t-[0.5px] max-md:border-border' : ''} ${
                i === 2 ? 'max-md:border-l-0' : ''
              }`}
            >
              <p className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                {stat.value}
                <span className="text-accent">{stat.suffix}</span>
              </p>
              <p className="mt-1.5 text-sm text-muted leading-snug">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* ── Testimonials ──────────────────────────────────────── */}
        <div className="mt-16 lg:mt-24">
          <div className="max-w-2xl mb-10 lg:mb-14">
            <h2 className="font-[family-name:var(--font-satoshi)] text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Ce qu&rsquo;ils en pensent
            </h2>
            <p className="mt-5 text-lg text-muted leading-relaxed">
              Parmi les 2&nbsp;000+ creatifs sur Vizly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={`py-8 md:py-0 md:px-8 ${
                  i > 0 ? 'md:border-l-[0.5px] md:border-border max-md:border-t-[0.5px] max-md:border-border' : ''
                }`}
              >
                {/* Decorative quote */}
                <span
                  className="block font-[family-name:var(--font-satoshi)] text-6xl leading-none text-border-light select-none"
                  aria-hidden="true"
                >
                  &ldquo;
                </span>

                {/* Quote text */}
                <p className="mt-2 text-sm text-muted leading-relaxed">
                  {t.text.split(t.highlight).map((part, j, arr) => (
                    <span key={j}>
                      {part}
                      {j < arr.length - 1 && (
                        <span className="font-semibold text-foreground">{t.highlight}</span>
                      )}
                    </span>
                  ))}
                </p>

                {/* Author */}
                <div className="mt-6 pt-4 border-t border-border-light">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: `${t.color}15` }}
                    >
                      <span
                        className="text-[11px] font-semibold leading-none"
                        style={{ color: t.color }}
                      >
                        {t.initials}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {t.role} &middot; {t.city}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Bottom CTA row ────────────────────────────────────── */}
        <div className="mt-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-8 border-t border-border-light">
          <div className="flex items-center gap-3">
            {/* Stacked avatars */}
            <div className="flex -space-x-2">
              {TESTIMONIALS.map((t) => (
                <div
                  key={t.initials}
                  className="w-7 h-7 rounded-full flex items-center justify-center border-2 border-background"
                  style={{ backgroundColor: `${t.color}20` }}
                >
                  <span
                    className="text-[9px] font-semibold leading-none"
                    style={{ color: t.color }}
                  >
                    {t.initials}
                  </span>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted">
              2&nbsp;000+ creatifs ont deja publie leur portfolio
            </p>
          </div>

          <Link
            href="/register"
            className="group inline-flex items-center gap-1.5 text-sm font-medium text-accent transition-colors duration-200 hover:text-accent-hover"
          >
            Rejoindre la communaute
            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  )
}
