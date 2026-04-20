import { getTranslations } from 'next-intl/server'
import { VzLogo, VzHighlight, vzBtnClasses } from '@/components/ui/vizly'
import { APP_URL } from '@/lib/constants'

export default async function NotFound() {
  const t = await getTranslations('notFound')

  // Les 404 déclenchées depuis un sous-domaine portfolio (slug.vizly.fr)
  // ne doivent pas renvoyer vers slug.vizly.fr/ ou slug.vizly.fr/templates
  // qui retomberaient en 404 aussi. On pointe systématiquement vers le
  // marketing sur le domaine racine.
  const homeHref = APP_URL
  const templatesHref = `${APP_URL}/templates`

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
      {/* Chiffre 404 géant en fond, très discret */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center font-[family-name:var(--font-satoshi)] text-[clamp(220px,42vw,480px)] font-extrabold leading-none text-border-light/60 select-none"
      >
        404
      </span>

      <div className="relative z-10 flex flex-col items-center">
        <a href={homeHref} className="mb-10 inline-block">
          <VzLogo size={32} />
        </a>

        <h1 className="font-[family-name:var(--font-satoshi)] text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t('titleLead')} <VzHighlight>{t('titleAccent')}</VzHighlight>
        </h1>
        <p className="mt-5 max-w-md text-base text-muted leading-relaxed">
          {t('description')}
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <a href={homeHref} className={vzBtnClasses({ variant: 'primary', size: 'lg' })}>
            {t('home')}
          </a>
          <a href={templatesHref} className={vzBtnClasses({ variant: 'secondary', size: 'lg' })}>
            {t('templates')}
          </a>
        </div>
      </div>
    </div>
  )
}
