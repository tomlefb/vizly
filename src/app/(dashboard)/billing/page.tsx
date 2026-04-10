import { getTranslations } from 'next-intl/server'
import { getBillingStatus } from '@/actions/billing'
import { BillingClient } from '@/components/billing/BillingClient'

interface BillingPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const t = await getTranslations('billing')
  const [billing, resolvedParams] = await Promise.all([
    getBillingStatus(),
    searchParams,
  ])

  // Determine checkout status from URL search params
  const checkoutParam = resolvedParams.checkout
  let checkoutStatus: 'success' | 'cancel' | null = null
  if (checkoutParam === 'success') checkoutStatus = 'success'
  if (checkoutParam === 'cancel') checkoutStatus = 'cancel'

  return (
    <div className="space-y-2">
      <h1 className="text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
        {t('title')}
      </h1>
      <p className="text-sm text-muted-foreground">
        {t('subtitle')}
      </p>

      <div className="pt-6">
        <BillingClient
          plan={billing.plan}
          purchasedTemplates={billing.purchasedTemplates}
          checkoutStatus={checkoutStatus}
        />
      </div>
    </div>
  )
}
