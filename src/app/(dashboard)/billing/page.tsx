import { getTranslations } from 'next-intl/server'
import { getBillingDetails } from '@/actions/billing'
import { BillingClient } from '@/components/billing/BillingClient'

export default async function BillingPage() {
  const [billing, t] = await Promise.all([
    getBillingDetails(),
    getTranslations('billing'),
  ])

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
        {t('titlePrefix')}{' '}
        <span className="text-accent">{t('titleAccent')}</span>.
      </h1>
      <p className="text-sm text-muted-foreground">{t('subtitle')}</p>

      <div className="pt-6">
        <BillingClient
          plan={billing.plan}
          subscription={billing.subscription}
          invoices={billing.invoices}
          purchasedTemplates={billing.purchasedTemplates}
        />
      </div>
    </div>
  )
}
