import { getTranslations } from 'next-intl/server'
import { BrowserFrame } from './BrowserFrame'

const PALETTE_COLORS = ['#1A1A1A', '#F1B434', '#FAF8F6', '#2563EB', '#7C3AED', '#059669']

const SECTION_KEYS = [
  { key: 'sectionProfile', active: true },
  { key: 'sectionProjects', active: true },
  { key: 'sectionKpis', active: true },
  { key: 'sectionContact', active: false },
] as const

export async function DesignMockup() {
  const t = await getTranslations('fonctionnalites.mockup.design')

  return (
    <BrowserFrame url="vizly.fr/editeur/design">
      <div className="flex divide-x divide-border-light">
        {/* Panneau gauche — Configuration */}
        <div className="w-2/5 p-4 space-y-4 bg-surface">
          {/* Template */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5">{t('templateLabel')}</div>
            <div className="h-7 rounded-[var(--radius-sm)] border border-border-light px-2.5 flex items-center justify-between text-[10px] text-foreground">
              <span>{t('templateValue')}</span>
              <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Palette */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5">{t('paletteLabel')}</div>
            <div className="flex gap-1.5">
              {PALETTE_COLORS.map((color, i) => (
                <div
                  key={color}
                  className={`w-5 h-5 rounded-full border ${
                    i === 1
                      ? 'border-accent-deep ring-1 ring-accent-deep ring-offset-1'
                      : 'border-border-light'
                  }`}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          {/* Police */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5">{t('fontLabel')}</div>
            <div className="h-7 rounded-[var(--radius-sm)] border border-border-light px-2.5 flex items-center justify-between text-[10px] text-foreground">
              <span>DM Sans</span>
              <svg className="w-3 h-3 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Sections */}
          <div>
            <div className="text-[10px] text-muted-foreground mb-1.5">{t('sectionsLabel')}</div>
            <div className="space-y-1.5">
              {SECTION_KEYS.map(section => (
                <div key={section.key} className="flex items-center justify-between">
                  <span className={`text-[10px] ${section.active ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {t(section.key)}
                  </span>
                  <div
                    className={`w-6 h-3.5 rounded-full flex items-center px-0.5 ${
                      section.active ? 'bg-accent justify-end' : 'bg-border-light justify-start'
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-surface" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Panneau droit — Preview */}
        <div className="flex-1 bg-surface-warm p-4">
          <div className="text-[9px] text-muted-foreground mb-2 text-center">{t('previewLabel')}</div>
          <div className="rounded-[var(--radius-sm)] bg-surface border border-border-light p-3 space-y-2.5">
            {/* Mini portfolio */}
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[5px] bg-accent" />
              <div>
                <div className="text-[9px] font-semibold text-foreground">{t('miniName')}</div>
                <div className="text-[7px] text-muted-foreground">{t('miniRole')}</div>
              </div>
            </div>
            <div className="h-px bg-border-light" />
            <div className="space-y-1">
              <div className="h-1.5 bg-surface-warm rounded-full w-full" />
              <div className="h-1.5 bg-surface-warm rounded-full w-4/5" />
              <div className="h-1.5 bg-surface-warm rounded-full w-3/5" />
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div className="h-10 bg-surface-warm rounded-[var(--radius-sm)]" />
              <div className="h-10 bg-surface-warm rounded-[var(--radius-sm)]" />
            </div>
            <div className="flex gap-1">
              <div className="h-1.5 bg-accent/40 rounded-full w-1/4" />
              <div className="h-1.5 bg-surface-warm rounded-full w-1/4" />
              <div className="h-1.5 bg-surface-warm rounded-full w-1/4" />
            </div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}
