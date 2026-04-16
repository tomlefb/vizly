import { getTranslations } from 'next-intl/server'
import { getBillingDetails } from '@/actions/billing'
import { BillingClient } from '@/components/billing/BillingClient'

export default async function BillingPage() {
  const [billing, t] = await Promise.all([
    getBillingDetails(),
    getTranslations('billing'),
  ])

  return (
    <div>
      <header className="mb-10">
        <h1 className="font-[family-name:var(--font-satoshi)] text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t('titlePrefix')} <span className="text-accent">{t('titleAccent')}</span>.
        </h1>
        <p className="mt-1.5 text-sm text-muted">{t('subtitle')}</p>
      </header>

      <BillingClient
        plan={billing.plan}
        subscription={billing.subscription}
        invoices={billing.invoices}
        purchasedTemplates={billing.purchasedTemplates}
      />
    </div>
  )
}
