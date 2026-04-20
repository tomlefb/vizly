import { getTranslations } from 'next-intl/server'
import { BrowserFrame } from './BrowserFrame'
import { VzAvatar, VzBadge } from '@/components/ui/vizly'

export async function PublishMockup() {
  const t = await getTranslations('fonctionnalites.mockup.publish')

  return (
    <BrowserFrame url="vizly.fr/dashboard">
      <div className="p-5 sm:p-6">
        {/* En-tête dashboard */}
        <div className="text-xs font-semibold text-foreground font-[family-name:var(--font-satoshi)] mb-3">
          {t('heading')}
        </div>

        {/* Carte projet */}
        <div className="rounded-[var(--radius-md)] border border-border-light bg-surface p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <VzAvatar initials="TL" size={28} />
              <div>
                <div className="text-[11px] font-semibold text-foreground">{t('portfolioName')}</div>
                <div className="text-[9px] text-muted-foreground">{t('updatedAt')}</div>
              </div>
            </div>
            <VzBadge variant="online">{t('badgeOnline')}</VzBadge>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{t('urlLabel')}</span>
              <span className="rounded-[var(--radius-sm)] bg-surface-warm border border-border-light px-2 py-0.5 text-[10px] text-foreground font-mono">
                thomas-l.vizly.fr
              </span>
            </div>
            <span className="rounded-[var(--radius-sm)] bg-foreground px-2.5 py-1 text-[9px] font-semibold text-surface">
              {t('editButton')}
            </span>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}
