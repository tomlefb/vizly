'use client'

// =============================================================================
// BillingClient — Vizly /billing custom recap (Phase 7 rewrite)
// =============================================================================
//
// 100 % data from local Supabase tables (subscriptions + invoices) populated
// by the Phase 3 webhook pipeline. Zero Stripe live calls per page render.
//
// Five blocks:
//   1. "Mon abonnement"      — current plan, interval, next billing date
//   2. "Changer de plan"     — context-aware CTAs (upgrade, downgrade, switch interval)
//   3. "Factures"            — local invoice history with hosted/PDF links
//   4. "Templates premium"   — adaptive: shown only when relevant to user state
//   5. "Gérer mon abonnement"— Stripe Billing Portal redirect (kept hosted)
//
// Modals (Phase 4 + 5) are reused as-is — this file only orchestrates state
// and never touches their internals.

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  Check,
  ExternalLink,
  FileText,
  Sparkles,
} from 'lucide-react'
import { cn, formatEur } from '@/lib/utils'
import {
  changeSubscriptionPlanAction,
  createBillingPortalAction,
  type BillingInvoiceSummary,
  type BillingSubscriptionSummary,
} from '@/actions/billing'
import { PLANS } from '@/lib/constants'
import type { BillingInterval } from '@/lib/stripe/prices'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal'
import { TemplatePurchaseModal } from './TemplatePurchaseModal'

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

interface BillingClientProps {
  plan: 'free' | 'starter' | 'pro'
  subscription: BillingSubscriptionSummary | null
  invoices: BillingInvoiceSummary[]
  purchasedTemplates: string[]
}

type PaidPlan = 'starter' | 'pro'
type LoadingAction = 'change-plan' | 'portal' | null

const INVOICES_INITIAL_LIMIT = 12
const TEMPLATE_PRICE_CENTS = 299
const SUCCESS_MESSAGE_TTL_MS = 5000

// ----------------------------------------------------------------------------
// Small helpers
// ----------------------------------------------------------------------------

function planName(plan: PaidPlan): string {
  return PLANS[plan].name
}

function planPriceCents(plan: PaidPlan, interval: BillingInterval): number {
  return PLANS[plan].priceCents[interval]
}

function formatLongDate(iso: string | null): string {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso))
}

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function BillingClient({
  plan,
  subscription,
  invoices,
  purchasedTemplates,
}: BillingClientProps) {
  const t = useTranslations('billing')
  const router = useRouter()

  // ---- State ---------------------------------------------------------------

  // billingInterval is only used for free users to pick which plan/interval
  // they want before opening the modal. Paid users have their interval
  // pinned to the current subscription.
  const [billingInterval, setBillingInterval] = useState<BillingInterval>(
    subscription?.interval ?? 'monthly',
  )
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showAllInvoices, setShowAllInvoices] = useState(false)
  const [subscriptionModalPlan, setSubscriptionModalPlan] =
    useState<PaidPlan | null>(null)
  const [templateModalId, setTemplateModalId] = useState<string | null>(null)

  // Auto-clear the success banner after a delay so it doesn't pile up after
  // multiple changes. Errors stay visible until next user action.
  useEffect(() => {
    if (!successMessage) return
    const timer = setTimeout(
      () => setSuccessMessage(null),
      SUCCESS_MESSAGE_TTL_MS,
    )
    return () => clearTimeout(timer)
  }, [successMessage])

  // ---- Helpers tied to translations ---------------------------------------

  const formatPlanPriceLabel = useCallback(
    (cents: number, interval: BillingInterval): string => {
      const suffix = interval === 'monthly' ? t('perMonth') : t('perYear')
      return `${formatEur(cents)}${suffix}`
    },
    [t],
  )

  // ---- Plan change handler (in-place for paid users) ----------------------

  const runPlanChange = useCallback(
    async (target: { plan: PaidPlan; interval: BillingInterval }) => {
      setError(null)
      setSuccessMessage(null)
      setLoadingAction('change-plan')

      const result = await changeSubscriptionPlanAction(target)

      if (!result.ok) {
        setError(result.error)
        setLoadingAction(null)
        return
      }

      setSuccessMessage(t('successUpdateBody'))
      setLoadingAction(null)
      router.refresh()
    },
    [t, router],
  )

  const openSubscriptionModal = useCallback((target: PaidPlan) => {
    setError(null)
    setSuccessMessage(null)
    setSubscriptionModalPlan(target)
  }, [])

  const handleBillingPortal = useCallback(async () => {
    setError(null)
    setSuccessMessage(null)
    setLoadingAction('portal')

    const result = await createBillingPortalAction()

    if (result.error) {
      setError(result.error)
      setLoadingAction(null)
      return
    }
    if (result.url) {
      window.location.href = result.url
    }
  }, [])

  const handleTemplatePurchase = useCallback((templateId: string) => {
    setError(null)
    setSuccessMessage(null)
    setTemplateModalId(templateId)
  }, [])

  // ---- Derived state -------------------------------------------------------

  // Cancellation banner is shown above the "Changer de plan" block when the
  // user has scheduled a cancel. On re-subscription the webhook clears
  // cancel_at_period_end and the banner disappears on next refresh.
  const showCancelBanner =
    subscription !== null &&
    subscription.cancel_at_period_end &&
    plan !== 'free'

  const visibleInvoices = useMemo(() => {
    if (showAllInvoices || invoices.length <= INVOICES_INITIAL_LIMIT) {
      return invoices
    }
    return invoices.slice(0, INVOICES_INITIAL_LIMIT)
  }, [invoices, showAllInvoices])

  const premiumTemplates = useMemo(
    () => TEMPLATE_CONFIGS.filter((tpl) => tpl.isPremium),
    [],
  )
  const purchasedPremiumTemplates = useMemo(
    () =>
      premiumTemplates.filter((tpl) => purchasedTemplates.includes(tpl.name)),
    [premiumTemplates, purchasedTemplates],
  )
  const hasPurchasedTemplates = purchasedPremiumTemplates.length > 0
  const showTemplatesBlock = plan !== 'free' || hasPurchasedTemplates

  // ---- Render --------------------------------------------------------------

  return (
    <div className="space-y-10">
      {/* 1. Cancel banner (above everything when applicable) */}
      {showCancelBanner && subscription && (
        <Banner variant="info">
          {subscription.current_period_end
            ? t('cancelBannerWithDate', {
                plan: planName(plan as PaidPlan),
                date: formatLongDate(subscription.current_period_end),
              })
            : t('cancelBannerNoDate', { plan: planName(plan as PaidPlan) })}
        </Banner>
      )}

      {/* 2. Success banner — auto-clears after 5s */}
      {successMessage && (
        <Banner variant="success" title={t('successUpdateTitle')}>
          {successMessage}
        </Banner>
      )}

      {/* 3. Error banner — persists until next user action */}
      {error && (
        <Banner variant="error" title={t('errorTitle')}>
          {error}
        </Banner>
      )}

      {/* ─── Bloc 1 : Mon abonnement ─────────────────────────────────── */}
      <SubscriptionBlock
        plan={plan}
        subscription={subscription}
        formatPlanPriceLabel={formatPlanPriceLabel}
      />

      {/* ─── Bloc 2 : Changer de plan / Choisis ton abonnement ───────── */}
      <ChangePlanBlock
        plan={plan}
        subscription={subscription}
        billingInterval={billingInterval}
        onIntervalChange={setBillingInterval}
        loadingAction={loadingAction}
        onOpenModal={openSubscriptionModal}
        onChangePlan={runPlanChange}
        formatPlanPriceLabel={formatPlanPriceLabel}
      />

      {/* ─── Bloc 3 : Factures ───────────────────────────────────────── */}
      {invoices.length > 0 && (
        <InvoicesBlock
          invoices={visibleInvoices}
          totalCount={invoices.length}
          showAll={showAllInvoices}
          onShowAll={() => setShowAllInvoices(true)}
        />
      )}

      {/* ─── Bloc 4 : Templates premium (adaptatif) ──────────────────── */}
      {showTemplatesBlock && (
        <TemplatesBlock
          plan={plan}
          premiumTemplates={premiumTemplates}
          purchasedPremiumTemplates={purchasedPremiumTemplates}
          purchasedTemplates={purchasedTemplates}
          loadingAction={loadingAction}
          onBuy={handleTemplatePurchase}
        />
      )}

      {/* ─── Bloc 5 : Gérer mon abonnement ───────────────────────────── */}
      {plan !== 'free' && (
        <ManageBlock
          loading={loadingAction === 'portal'}
          onClick={handleBillingPortal}
        />
      )}

      {/* Modals (Phase 4 + 5, untouched) */}
      {subscriptionModalPlan && (
        <SubscriptionCheckoutModal
          open={subscriptionModalPlan !== null}
          onClose={() => setSubscriptionModalPlan(null)}
          plan={subscriptionModalPlan}
          interval={billingInterval}
          onSuccess={() => router.refresh()}
        />
      )}

      {templateModalId && (
        <TemplatePurchaseModal
          open={templateModalId !== null}
          onClose={() => setTemplateModalId(null)}
          templateId={templateModalId}
          templateLabel={
            TEMPLATE_CONFIGS.find((tpl) => tpl.name === templateModalId)?.label ??
            templateModalId
          }
          onSuccess={() => router.refresh()}
        />
      )}
    </div>
  )
}

// ============================================================================
// Sub-components — kept in the same file for now (no shared external use).
// Moving them out is a polish-only refactor reserved for a future cleanup.
// ============================================================================

// ---- Banner --------------------------------------------------------------

interface BannerProps {
  variant: 'info' | 'success' | 'error'
  title?: string
  children: React.ReactNode
}

function Banner({ variant, title, children }: BannerProps) {
  const Icon = variant === 'error' ? AlertCircle : Check
  const iconColor =
    variant === 'error' ? 'text-destructive' : 'text-foreground'

  return (
    <div className="flex items-start gap-3 rounded-lg border border-border bg-surface-warm px-4 py-3">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} />
      <div className="text-sm">
        {title && (
          <p className="font-medium text-foreground">{title}</p>
        )}
        <p className={cn(title ? 'mt-0.5' : '', 'text-foreground')}>
          {children}
        </p>
      </div>
    </div>
  )
}

// ---- Bloc 1 : Mon abonnement ---------------------------------------------

interface SubscriptionBlockProps {
  plan: 'free' | 'starter' | 'pro'
  subscription: BillingSubscriptionSummary | null
  formatPlanPriceLabel: (cents: number, interval: BillingInterval) => string
}

function SubscriptionBlock({
  plan,
  subscription,
  formatPlanPriceLabel,
}: SubscriptionBlockProps) {
  const t = useTranslations('billing')

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
        {t('mySubscription')}
      </h2>

      {plan === 'free' || subscription === null ? (
        <p className="text-sm text-muted-foreground">
          {t('noActiveSubscription')}
        </p>
      ) : (
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <DetailField label={t('currentPlan')}>
            <span className="text-sm font-medium text-foreground">
              {planName(plan as PaidPlan)}
            </span>
            <span className="text-sm text-muted-foreground">
              {' · '}
              {formatPlanPriceLabel(
                planPriceCents(plan as PaidPlan, subscription.interval),
                subscription.interval,
              )}
            </span>
          </DetailField>

          <DetailField label={t('currentInterval')}>
            <span className="text-sm text-foreground">
              {subscription.interval === 'monthly'
                ? t('billingMonthly')
                : t('billingYearly')}
            </span>
          </DetailField>

          <DetailField label={t('nextBilling')}>
            <span className="text-sm text-foreground">
              {subscription.cancel_at_period_end ? (
                <StatusBadge tone="warning">
                  {t('statusCancelScheduled')}
                </StatusBadge>
              ) : (
                formatLongDate(subscription.current_period_end)
              )}
            </span>
          </DetailField>
        </dl>
      )}
    </section>
  )
}

function DetailField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd>{children}</dd>
    </div>
  )
}

function StatusBadge({
  tone,
  children,
}: {
  tone: 'active' | 'warning'
  children: React.ReactNode
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        tone === 'active'
          ? 'bg-surface-warm text-foreground'
          : 'bg-surface-warm text-foreground',
      )}
    >
      {children}
    </span>
  )
}

// ---- Bloc 2 : Changer de plan --------------------------------------------

interface ChangePlanBlockProps {
  plan: 'free' | 'starter' | 'pro'
  subscription: BillingSubscriptionSummary | null
  billingInterval: BillingInterval
  onIntervalChange: (i: BillingInterval) => void
  loadingAction: LoadingAction
  onOpenModal: (plan: PaidPlan) => void
  onChangePlan: (target: { plan: PaidPlan; interval: BillingInterval }) => void
  formatPlanPriceLabel: (cents: number, interval: BillingInterval) => string
}

function ChangePlanBlock({
  plan,
  subscription,
  billingInterval,
  onIntervalChange,
  loadingAction,
  onOpenModal,
  onChangePlan,
  formatPlanPriceLabel,
}: ChangePlanBlockProps) {
  const t = useTranslations('billing')
  const isLoading = loadingAction === 'change-plan'

  // Free users : show a binary plan picker with an interval toggle
  if (plan === 'free' || subscription === null) {
    return (
      <section className="space-y-4 border-t border-border pt-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            {t('choosePlan')}
          </h2>
          <IntervalToggle
            value={billingInterval}
            onChange={onIntervalChange}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <PrimaryButton
            disabled={isLoading}
            loading={isLoading}
            onClick={() => onOpenModal('starter')}
          >
            {t('ctaUpgradeStarter', {
              price: formatPlanPriceLabel(
                planPriceCents('starter', billingInterval),
                billingInterval,
              ),
            })}
          </PrimaryButton>
          <SecondaryButton
            disabled={isLoading}
            loading={isLoading}
            onClick={() => onOpenModal('pro')}
          >
            {t('ctaUpgradePro', {
              price: formatPlanPriceLabel(
                planPriceCents('pro', billingInterval),
                billingInterval,
              ),
            })}
          </SecondaryButton>
        </div>
      </section>
    )
  }

  // Paid users : context-aware CTAs
  const currentInterval = subscription.interval
  const otherInterval: BillingInterval =
    currentInterval === 'monthly' ? 'yearly' : 'monthly'

  const ctas: Array<{
    label: string
    variant: 'primary' | 'secondary'
    target: { plan: PaidPlan; interval: BillingInterval }
  }> = []

  if (plan === 'starter') {
    // Upgrade to Pro on the same interval (primary)
    ctas.push({
      label: t('ctaUpgradePro', {
        price: formatPlanPriceLabel(
          planPriceCents('pro', currentInterval),
          currentInterval,
        ),
      }),
      variant: 'primary',
      target: { plan: 'pro', interval: currentInterval },
    })
  } else {
    // Pro → downgrade to Starter on the same interval (secondary, not primary
    // because it's a downgrade)
    ctas.push({
      label: t('ctaDowngradeStarter', {
        price: formatPlanPriceLabel(
          planPriceCents('starter', currentInterval),
          currentInterval,
        ),
      }),
      variant: 'secondary',
      target: { plan: 'starter', interval: currentInterval },
    })
  }

  // Switch interval on the SAME plan (secondary)
  ctas.push({
    label:
      otherInterval === 'yearly'
        ? t('ctaSwitchToYearly')
        : t('ctaSwitchToMonthly'),
    variant: 'secondary',
    target: { plan: plan as PaidPlan, interval: otherInterval },
  })

  return (
    <section className="space-y-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
        {t('changePlan')}
      </h2>

      <div className="flex flex-wrap gap-3">
        {ctas.map((cta, idx) => {
          const Btn = cta.variant === 'primary' ? PrimaryButton : SecondaryButton
          return (
            <Btn
              key={idx}
              disabled={isLoading}
              loading={isLoading}
              onClick={() => onChangePlan(cta.target)}
            >
              {cta.label}
            </Btn>
          )
        })}
      </div>
    </section>
  )
}

function IntervalToggle({
  value,
  onChange,
}: {
  value: BillingInterval
  onChange: (i: BillingInterval) => void
}) {
  const t = useTranslations('billing')
  return (
    <div className="inline-flex items-center rounded-md border border-border p-0.5 text-xs font-medium">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded px-3 py-1.5 transition-colors duration-150',
          value === 'monthly'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {t('monthly')}
      </button>
      <button
        type="button"
        onClick={() => onChange('yearly')}
        className={cn(
          'rounded px-3 py-1.5 transition-colors duration-150',
          value === 'yearly'
            ? 'bg-foreground text-background'
            : 'text-muted-foreground hover:text-foreground',
        )}
      >
        {t('yearly')}{' '}
        <span className="ml-0.5 text-muted-foreground">
          {t('yearlyDiscount')}
        </span>
      </button>
    </div>
  )
}

// ---- Bloc 3 : Factures ---------------------------------------------------

interface InvoicesBlockProps {
  invoices: BillingInvoiceSummary[]
  totalCount: number
  showAll: boolean
  onShowAll: () => void
}

function InvoicesBlock({
  invoices,
  totalCount,
  showAll,
  onShowAll,
}: InvoicesBlockProps) {
  const t = useTranslations('billing')
  const hasMore = !showAll && totalCount > INVOICES_INITIAL_LIMIT

  return (
    <section className="space-y-4 border-t border-border pt-8">
      <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
        {t('invoicesTitle')}
      </h2>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-surface-warm text-left">
            <tr>
              <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColDate')}
              </th>
              <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColNumber')}
              </th>
              <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColAmount')}
              </th>
              <th className="px-4 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColLinks')}
              </th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="border-b border-border last:border-b-0"
              >
                <td className="px-4 py-3 text-foreground">
                  {formatShortDate(invoice.paid_at)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {invoice.number ?? '—'}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatEur(invoice.amount_paid)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {invoice.hosted_invoice_url && (
                      <a
                        href={invoice.hosted_invoice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        {t('invoiceLinkHosted')}
                      </a>
                    )}
                    {invoice.invoice_pdf && (
                      <a
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted-foreground transition-colors duration-150 hover:text-foreground"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        {t('invoiceLinkPdf')}
                      </a>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <button
          type="button"
          onClick={onShowAll}
          className="text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {t('invoicesShowAll')}
        </button>
      )}
    </section>
  )
}

// ---- Bloc 4 : Templates premium (adaptatif) ------------------------------

interface TemplatesBlockProps {
  plan: 'free' | 'starter' | 'pro'
  premiumTemplates: typeof TEMPLATE_CONFIGS
  purchasedPremiumTemplates: typeof TEMPLATE_CONFIGS
  purchasedTemplates: string[]
  loadingAction: LoadingAction
  onBuy: (templateId: string) => void
}

function TemplatesBlock({
  plan,
  premiumTemplates,
  purchasedPremiumTemplates,
  purchasedTemplates,
  loadingAction,
  onBuy,
}: TemplatesBlockProps) {
  const t = useTranslations('billing')
  const showPurchasedView = purchasedPremiumTemplates.length > 0

  if (showPurchasedView) {
    return (
      <section className="space-y-4 border-t border-border pt-8">
        <div>
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            {t('templatesPurchasedTitle')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('templatesPurchasedSubtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {purchasedPremiumTemplates.map((template) => (
            <div
              key={template.name}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-medium text-foreground">
                  {template.label}
                </h3>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Check className="h-3 w-3" />
                  {t('templateAlreadyOwned')}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                {template.description}
              </p>
            </div>
          ))}
        </div>

        <Link
          href="/templates"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {t('templatesPurchasedSeeAll')}
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </section>
    )
  }

  // Paid user, no premium template purchased yet → show the buyable grid
  return (
    <section className="space-y-4 border-t border-border pt-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          {t('templatesAvailableTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('templatesAvailableSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {premiumTemplates.map((template) => {
          const isPurchased = purchasedTemplates.includes(template.name)
          const canBuy = plan !== 'free' && !isPurchased

          return (
            <div
              key={template.name}
              className="rounded-lg border border-border bg-background p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-sm font-medium text-foreground">
                    {template.label}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.description}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('templateIdealFor', { use: template.idealFor })}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded bg-surface-warm px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  {t('templatePremiumBadge')}
                </span>
              </div>

              {canBuy && (
                <button
                  type="button"
                  onClick={() => onBuy(template.name)}
                  disabled={loadingAction !== null}
                  className={cn(
                    'mt-3 inline-flex h-9 items-center gap-2 rounded-md px-4 text-sm font-medium transition-colors duration-150',
                    'bg-accent text-white hover:bg-accent-hover',
                    'disabled:cursor-not-allowed disabled:bg-accent/40',
                  )}
                >
                  {t('templateBuyCta', {
                    price: formatEur(TEMPLATE_PRICE_CENTS),
                  })}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ---- Bloc 5 : Gérer mon abonnement ---------------------------------------

function ManageBlock({
  loading,
  onClick,
}: {
  loading: boolean
  onClick: () => void
}) {
  const t = useTranslations('billing')
  return (
    <section className="space-y-4 border-t border-border pt-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          {t('manageTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('manageDescription')}
        </p>
      </div>

      <SecondaryButton
        loading={loading}
        disabled={loading}
        onClick={() => void onClick()}
      >
        {t('manageCta')}
        <ExternalLink className="h-3.5 w-3.5" />
      </SecondaryButton>
    </section>
  )
}

// ---- Buttons -------------------------------------------------------------

interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

function PrimaryButton({ children, onClick, disabled, loading }: ButtonProps) {
  const t = useTranslations('billing')
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-md px-5 text-sm font-medium transition-colors duration-150',
        'bg-accent text-white hover:bg-accent-hover',
        'disabled:cursor-not-allowed disabled:bg-accent/40',
      )}
    >
      {loading ? t('ctaLoading') : children}
    </button>
  )
}

function SecondaryButton({ children, onClick, disabled, loading }: ButtonProps) {
  const t = useTranslations('billing')
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors duration-150',
        'hover:bg-surface-warm',
        'disabled:cursor-not-allowed disabled:text-muted-foreground',
      )}
    >
      {loading ? t('ctaLoading') : children}
    </button>
  )
}
