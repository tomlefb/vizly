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
/*  Features                                                           */
/* ------------------------------------------------------------------ */

const FEATURES = [
  { title: 'Formulaire guide', desc: 'Etape par etape, zero prise de tete.' },
  { title: '8 templates pro', desc: 'Du minimal au bold, chacun son style.' },
  { title: 'Live en 5 min', desc: 'Ton site sur prenom.vizly.fr instantanement.' },
  { title: 'Mobile-first', desc: 'Parfait sur tous les ecrans.' },
  { title: 'Personnalisable', desc: 'Couleurs, typos, sections a ta guise.' },
  { title: 'Projets illimites', desc: 'Montre tout ton travail, sans limite.' },
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

        {/* ── Divider ───────────────────────────────────────────── */}
        <div className="border-t border-border mt-12 lg:mt-16" />

        {/* ── Features text grid ────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 mt-10 lg:mt-12">
          {FEATURES.map((feat, i) => (
            <div
              key={feat.title}
              className={`py-4 md:py-0 md:px-5 lg:px-6 ${
                i > 0 ? 'lg:border-l-[0.5px] lg:border-border' : ''
              } ${i % 2 !== 0 ? 'max-md:border-l-[0.5px] max-md:border-border' : ''} ${
                i % 3 !== 0 ? 'max-lg:md:border-l-[0.5px] max-lg:md:border-border' : ''
              } ${i >= 2 ? 'max-md:border-t-[0.5px] max-md:border-border' : ''} ${
                i >= 3 ? 'max-lg:md:border-t-[0.5px] max-lg:md:border-border' : ''
              }`}
            >
              <p className="text-[15px] font-semibold text-foreground tracking-wide">
                {feat.title}
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground leading-relaxed">
                {feat.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
