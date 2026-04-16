'use client'

// =============================================================================
// BillingClient — Vizly /billing custom recap (Phase 7 + 7.5 fixup)
// =============================================================================
//
// 100 % data from local Supabase tables, populated by the Phase 3 webhook
// pipeline. Zero Stripe live calls per page render.
//
// Source-of-truth contract (Phase 7.5):
//   - `plan` (from users.plan) is the canonical plan. Always trust it.
//   - `subscription` row is an OPTIONAL ENRICHMENT. May be null even for
//     paid users (legacy hydration miss). UI must render a fallback
//     when paid-plan + null-subscription.
//
// Five blocks:
//   1. "Mon abonnement"      — current plan card with features
//   2. "Choisis ton abonnement" / "Changer de plan" — context-aware
//   3. "Factures"            — local invoice history
//   4. "Templates premium"   — adaptive
//   5. "Gérer mon abonnement"— Stripe Billing Portal redirect (kept hosted)

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import {
  AlertCircle,
  Check,
  CreditCard,
  Crown,
  ExternalLink,
  FileText,
  Sparkles,
} from 'lucide-react'
import { cn, formatEur } from '@/lib/utils'
import {
  cancelSubscriptionAction,
  changeSubscriptionPlanAction,
  reactivateSubscriptionAction,
  type BillingInvoiceSummary,
  type BillingSubscriptionSummary,
} from '@/actions/billing'
import { PLANS } from '@/lib/constants'
import type { BillingInterval } from '@/lib/stripe/prices'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import { SubscriptionCheckoutModal } from './SubscriptionCheckoutModal'
import { TemplatePurchaseModal } from './TemplatePurchaseModal'
import { UpdatePaymentMethodModal } from './UpdatePaymentMethodModal'
import { ConfirmActionDialog } from './ConfirmActionDialog'
import { getErrorMessage } from './CheckoutErrorMessage'

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
type LoadingAction = 'change-plan' | 'cancel' | 'reactivate' | null

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
  const [updateCardModalOpen, setUpdateCardModalOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState(false)
  const [dialogError, setDialogError] = useState<string | null>(null)

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

  const handleOpenUpdateCard = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
    setUpdateCardModalOpen(true)
  }, [])

  const handleOpenCancel = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
    setDialogError(null)
    setCancelDialogOpen(true)
  }, [])

  const handleOpenReactivate = useCallback(() => {
    setError(null)
    setSuccessMessage(null)
    setDialogError(null)
    setReactivateDialogOpen(true)
  }, [])

  const handleConfirmCancel = useCallback(async () => {
    setLoadingAction('cancel')
    setDialogError(null)
    const result = await cancelSubscriptionAction()
    setLoadingAction(null)
    if (!result.ok) {
      setDialogError(getErrorMessage(result.error))
      return
    }
    setCancelDialogOpen(false)
    setSuccessMessage(t('cancelSuccessBody'))
    router.refresh()
  }, [t, router])

  const handleConfirmReactivate = useCallback(async () => {
    setLoadingAction('reactivate')
    setDialogError(null)
    const result = await reactivateSubscriptionAction()
    setLoadingAction(null)
    if (!result.ok) {
      setDialogError(getErrorMessage(result.error))
      return
    }
    setReactivateDialogOpen(false)
    setSuccessMessage(t('reactivateSuccessBody'))
    router.refresh()
  }, [t, router])

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
            : t('cancelBannerNoDate', {
                plan: planName(plan as PaidPlan),
              })}
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

      {/* ─── Bloc 1 : Mon abonnement — inclut les CTAs "Changer de plan" ──
          inline en haut à droite de la card pour les paid users. Masqué
          pour les free users (le Bloc 2 joue le rôle d'accueil). ───── */}
      {plan !== 'free' && (
        <SubscriptionBlock
          plan={plan}
          subscription={subscription}
          formatPlanPriceLabel={formatPlanPriceLabel}
          loadingAction={loadingAction}
          onUpdateCard={handleOpenUpdateCard}
          onCancel={handleOpenCancel}
          onReactivate={handleOpenReactivate}
          onChangePlan={runPlanChange}
        />
      )}

      {/* ─── Bloc 2 : Choisis ton abonnement (free users uniquement) ─── */}
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

      {/* ─── Bloc 4 : Lien vers /mes-templates (remplace le bloc complet ────
          Templates premium — /mes-templates est la source unique de vérité). */}
      {plan !== 'free' && (
        <TemplatesLink hasPurchased={hasPurchasedTemplates} />
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

      <UpdatePaymentMethodModal
        open={updateCardModalOpen}
        onClose={() => setUpdateCardModalOpen(false)}
        onSuccess={() => {
          setSuccessMessage(t('updateCardSuccessBody'))
          router.refresh()
        }}
      />

      <ConfirmActionDialog
        open={cancelDialogOpen}
        onClose={() => {
          if (loadingAction === 'cancel') return
          setCancelDialogOpen(false)
          setDialogError(null)
        }}
        onConfirm={handleConfirmCancel}
        title={t('cancelDialogTitle')}
        description={
          subscription?.current_period_end
            ? t('cancelDialogDescriptionWithDate', {
                date: formatLongDate(subscription.current_period_end),
              })
            : t('cancelDialogDescriptionNoDate')
        }
        confirmLabel={
          loadingAction === 'cancel'
            ? t('ctaLoading')
            : t('cancelDialogConfirm')
        }
        cancelLabel={t('cancelDialogCancel')}
        confirmVariant="destructive"
        error={dialogError}
      />

      <ConfirmActionDialog
        open={reactivateDialogOpen}
        onClose={() => {
          if (loadingAction === 'reactivate') return
          setReactivateDialogOpen(false)
          setDialogError(null)
        }}
        onConfirm={handleConfirmReactivate}
        title={t('reactivateDialogTitle')}
        description={
          subscription?.current_period_end
            ? t('reactivateDialogDescriptionWithDate', {
                date: formatLongDate(subscription.current_period_end),
              })
            : t('reactivateDialogDescriptionNoDate')
        }
        confirmLabel={
          loadingAction === 'reactivate'
            ? t('ctaLoading')
            : t('reactivateDialogConfirm')
        }
        cancelLabel={t('cancelDialogCancel')}
        confirmVariant="primary"
        error={dialogError}
      />
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
    <div className="flex items-start gap-3 rounded-[var(--radius-md)] border border-border bg-surface-warm px-4 py-3">
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconColor)} strokeWidth={2} />
      <div className="text-sm">
        {title && <p className="font-medium text-foreground">{title}</p>}
        <p className={cn(title ? 'mt-0.5' : '', 'text-foreground')}>{children}</p>
      </div>
    </div>
  )
}

// ---- Bloc 1 : Mon abonnement ---------------------------------------------

interface SubscriptionBlockProps {
  plan: 'free' | 'starter' | 'pro'
  subscription: BillingSubscriptionSummary | null
  formatPlanPriceLabel: (cents: number, interval: BillingInterval) => string
  loadingAction: LoadingAction
  onUpdateCard: () => void
  onCancel: () => void
  onReactivate: () => void
  onChangePlan: (target: { plan: PaidPlan; interval: BillingInterval }) => void
}

function SubscriptionBlock({
  plan,
  subscription,
  formatPlanPriceLabel,
  loadingAction,
  onUpdateCard,
  onCancel,
  onReactivate,
  onChangePlan,
}: SubscriptionBlockProps) {
  // H2 "Mon abonnement" retiré : redondant avec le H1 de la page. La
  // PlanCard se suffit à elle-même (nom du plan, prix et features dedans).
  if (plan === 'free') {
    return null
  }
  return (
    <PlanCard
      plan={plan as PaidPlan}
      subscription={subscription}
      formatPlanPriceLabel={formatPlanPriceLabel}
      loadingAction={loadingAction}
      onUpdateCard={onUpdateCard}
      onCancel={onCancel}
      onReactivate={onReactivate}
      onChangePlan={onChangePlan}
    />
  )
}

interface PlanCardProps {
  plan: PaidPlan
  subscription: BillingSubscriptionSummary | null
  formatPlanPriceLabel: (cents: number, interval: BillingInterval) => string
  loadingAction: LoadingAction
  onUpdateCard: () => void
  onCancel: () => void
  onReactivate: () => void
  onChangePlan: (target: { plan: PaidPlan; interval: BillingInterval }) => void
}

function PlanCard({
  plan,
  subscription,
  formatPlanPriceLabel,
  loadingAction,
  onUpdateCard,
  onCancel,
  onReactivate,
  onChangePlan,
}: PlanCardProps) {
  const t = useTranslations('billing')
  const planConfig = PLANS[plan]
  // For legacy users (no subscription row), default to monthly pricing.
  const interval: BillingInterval = subscription?.interval ?? 'monthly'
  const isScheduledCancel = subscription?.cancel_at_period_end === true
  const isChangingPlan = loadingAction === 'change-plan'

  // Crown only on Pro — explicit DA exception validated by Tom: Crown
  // colored amber is allowed exclusively on this single icon, nowhere
  // else. CreditCard stays neutral text-foreground for Starter.
  const PlanIcon = plan === 'pro' ? Crown : CreditCard
  const iconColor = plan === 'pro' ? 'text-amber-500' : 'text-foreground'

  // Paid user with a real subscription and not scheduled for cancel → show
  // the 2 context-aware change-plan CTAs in the header right. Otherwise
  // hide them (legacy hydration miss OR cancellation pending).
  const paidChangeCTAs: PaidChangePlanCTA[] =
    subscription !== null && !isScheduledCancel
      ? computePaidChangePlanCTAs({
          plan,
          subscription,
          formatPlanPriceLabel,
          t,
        })
      : []

  return (
    <div className="rounded-[var(--radius-lg)] border border-border-light bg-surface p-6">
      {/* Header : icône + nom + prix + CTAs de changement de plan à droite */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <PlanIcon
            className={cn('mt-0.5 h-5 w-5 shrink-0', iconColor)}
            strokeWidth={1.5}
            aria-hidden="true"
          />
          <div>
            <h3 className="font-[family-name:var(--font-satoshi)] text-base font-semibold text-foreground">
              {t('planLabel', { name: planConfig.name })}
            </h3>
            <p className="text-sm text-muted">
              {formatPlanPriceLabel(planConfig.priceCents[interval], interval)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {paidChangeCTAs.map((cta, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onChangePlan(cta.target)}
              disabled={isChangingPlan}
              className={cn(
                'inline-flex h-8 items-center justify-center rounded-[var(--radius-md)] border px-3 text-xs font-medium transition-colors duration-150',
                'border-border bg-surface text-foreground hover:bg-surface-warm',
                'disabled:cursor-not-allowed disabled:text-muted-foreground',
              )}
            >
              {isChangingPlan ? t('ctaLoading') : cta.label}
            </button>
          ))}
          {isScheduledCancel && <PlanBadge plan={plan} cancelled />}
        </div>
      </div>

      {/* Liste des features incluses */}
      {planConfig.features.length > 0 && (
        <ul
          className="mt-5 space-y-2.5"
          aria-label={t('planFeaturesLabel')}
        >
          {planConfig.features.map((feature) => (
            <li
              key={feature}
              className="flex items-center gap-2 text-sm text-foreground"
            >
              <Check
                className="h-4 w-4 shrink-0 text-success"
                strokeWidth={2.5}
                aria-hidden="true"
              />
              {feature}
            </li>
          ))}
        </ul>
      )}

      {/* Footer : statut + actions de gestion (in-card) */}
      <div className="mt-6 space-y-4 border-t border-border-light pt-5">
        {subscription !== null && subscription.current_period_end && (
          <p
            className={cn(
              'text-sm',
              isScheduledCancel ? 'text-foreground' : 'text-muted',
            )}
          >
            {isScheduledCancel
              ? t('activeUntil', {
                  date: formatLongDate(subscription.current_period_end),
                })
              : t('nextBilling', {
                  date: formatLongDate(subscription.current_period_end),
                })}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onUpdateCard}
            className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:bg-surface-warm"
          >
            {t('updateCardCta')}
          </button>
          {isScheduledCancel ? (
            <button
              type="button"
              onClick={onReactivate}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] bg-accent px-4 text-sm font-semibold text-white transition-colors duration-150 hover:bg-accent-hover"
            >
              {t('reactivateCta')}
            </button>
          ) : (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex h-9 items-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-4 text-sm font-medium text-muted transition-colors duration-150 hover:border-destructive/20 hover:bg-destructive/5 hover:text-destructive"
            >
              {t('cancelCta')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function PlanBadge({ plan, cancelled }: { plan: PaidPlan; cancelled: boolean }) {
  const t = useTranslations('billing')
  if (cancelled) {
    return (
      <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-destructive/10 px-2 py-0.5 text-xs font-medium uppercase text-destructive">
        {t('badgeCancelled')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-[var(--radius-sm)] bg-surface-warm px-2 py-0.5 text-xs font-medium uppercase text-foreground">
      {PLANS[plan].name}
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

  // ---- Free users : two side-by-side plan cards with features ----
  if (plan === 'free') {
    return (
      <section className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
            {t('choosePlan')}
          </h2>
          <IntervalToggle
            value={billingInterval}
            onChange={onIntervalChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-5 pt-2 md:grid-cols-2">
          <ChoosePlanCard
            plan="starter"
            interval={billingInterval}
            featured
            ctaVariant="primary"
            ctaLabel={t('ctaPickStarter')}
            disabled={isLoading}
            loading={isLoading}
            onClick={() => onOpenModal('starter')}
            formatPlanPriceLabel={formatPlanPriceLabel}
          />
          <ChoosePlanCard
            plan="pro"
            interval={billingInterval}
            ctaVariant="secondary"
            ctaLabel={t('ctaPickPro')}
            disabled={isLoading}
            loading={isLoading}
            onClick={() => onOpenModal('pro')}
            formatPlanPriceLabel={formatPlanPriceLabel}
          />
        </div>
      </section>
    )
  }

  // ---- Paid users : les CTAs "Changer de plan" sont désormais inline ----
  // dans le header de la PlanCard (voir computePaidChangePlanCTAs et
  // l'intégration dans PlanCard). On ne rend rien ici pour éviter la
  // section dédiée qui dupliquait ces actions.
  return null
}

// ---- Helper : build the 2 context-aware CTAs for paid users ----

interface PaidChangePlanCTA {
  label: string
  variant: 'primary' | 'secondary'
  target: { plan: PaidPlan; interval: BillingInterval }
}

function computePaidChangePlanCTAs(params: {
  plan: 'starter' | 'pro'
  subscription: BillingSubscriptionSummary
  formatPlanPriceLabel: (cents: number, interval: BillingInterval) => string
  t: ReturnType<typeof useTranslations<'billing'>>
}): PaidChangePlanCTA[] {
  const { plan, subscription, formatPlanPriceLabel, t } = params
  const currentInterval = subscription.interval
  const otherInterval: BillingInterval =
    currentInterval === 'monthly' ? 'yearly' : 'monthly'

  const ctas: PaidChangePlanCTA[] = []

  if (plan === 'starter') {
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

  ctas.push({
    label:
      otherInterval === 'yearly'
        ? t('ctaSwitchToYearly')
        : t('ctaSwitchToMonthly'),
    variant: 'secondary',
    target: { plan, interval: otherInterval },
  })

  return ctas
}

// ---- ChoosePlanCard : full plan card used in the free-user 2-up grid ----

interface ChoosePlanCardProps {
  plan: PaidPlan
  interval: BillingInterval
  featured?: boolean
  ctaVariant: 'primary' | 'secondary'
  ctaLabel: string
  disabled: boolean
  loading: boolean
  onClick: () => void
  formatPlanPriceLabel: (cents: number, interval: BillingInterval) => string
}

function ChoosePlanCard({
  plan,
  interval,
  featured = false,
  ctaVariant,
  ctaLabel,
  disabled,
  loading,
  onClick,
  formatPlanPriceLabel,
}: ChoosePlanCardProps) {
  const t = useTranslations('billing')
  const planConfig = PLANS[plan]
  const Btn = ctaVariant === 'primary' ? PrimaryButton : SecondaryButton

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-[var(--radius-lg)] bg-surface p-6 transition-all duration-200',
        featured
          ? 'border-[1.5px] border-accent md:-translate-y-2'
          : 'border border-border-light hover:border-border hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]',
      )}
    >
      {featured && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
            <span className="h-1.5 w-1.5 rounded-full bg-white" />
            {t('popular')}
          </span>
        </div>
      )}

      <div>
        <h3 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
          {planConfig.name}
        </h3>
        <p className="mt-1 text-sm text-muted">
          {formatPlanPriceLabel(planConfig.priceCents[interval], interval)}
        </p>
      </div>

      <ul
        className="mt-5 flex-1 space-y-2.5"
        aria-label={t('planFeaturesLabel')}
      >
        {planConfig.features.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <Check
              className="h-4 w-4 shrink-0 text-success"
              strokeWidth={2.5}
              aria-hidden="true"
            />
            {feature}
          </li>
        ))}
      </ul>

      <div className="mt-7">
        <Btn fullWidth disabled={disabled} loading={loading} onClick={onClick}>
          {ctaLabel}
        </Btn>
      </div>
    </div>
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
    <div className="flex items-center gap-3">
      <div className="inline-flex items-center rounded-full bg-[#f4f4f4] p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className={cn(
            'rounded-full px-4 py-1.5 transition-colors duration-150',
            value === 'monthly'
              ? 'border border-border bg-white text-foreground'
              : 'text-muted hover:text-foreground',
          )}
        >
          {t('monthly')}
        </button>
        <button
          type="button"
          onClick={() => onChange('yearly')}
          className={cn(
            'rounded-full px-4 py-1.5 transition-colors duration-150',
            value === 'yearly'
              ? 'border border-border bg-white text-foreground'
              : 'text-muted hover:text-foreground',
          )}
        >
          {t('yearly')}
        </button>
      </div>
      {value === 'yearly' && (
        <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-semibold text-white">
          {t('yearlyDiscount')}
        </span>
      )}
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
    <section className="space-y-4">
      <h2 className="font-[family-name:var(--font-satoshi)] text-lg font-semibold text-foreground">
        {t('invoicesTitle')}
      </h2>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border-light bg-surface">
        <table className="w-full text-sm">
          <thead className="border-b border-border-light bg-surface-warm text-left">
            <tr>
              <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColDate')}
              </th>
              <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColNumber')}
              </th>
              <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColAmount')}
              </th>
              <th className="px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('invoiceColLinks')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-light">
            {invoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="transition-colors duration-150 hover:bg-surface-warm"
              >
                <td className="px-4 py-3 text-foreground">
                  {formatShortDate(invoice.paid_at)}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted">
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
                        className="inline-flex items-center gap-1 text-muted transition-colors duration-150 hover:text-foreground"
                      >
                        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
                        {t('invoiceLinkHosted')}
                      </a>
                    )}
                    {invoice.invoice_pdf && (
                      <a
                        href={invoice.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-muted transition-colors duration-150 hover:text-foreground"
                      >
                        <FileText className="h-3.5 w-3.5" strokeWidth={1.5} />
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
          className="text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground"
        >
          {t('invoicesShowAll')}
        </button>
      )}
    </section>
  )
}

// ---- Bloc 4 : Lien vers /mes-templates (remplace le gros bloc templates) --

function TemplatesLink({ hasPurchased }: { hasPurchased: boolean }) {
  const t = useTranslations('billing')
  return (
    <section>
      <Link
        href="/mes-templates"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors duration-150 hover:text-foreground"
      >
        {hasPurchased ? t('templatesPurchasedSeeAll') : t('seeMyPremiumTemplates')}
        <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.5} />
      </Link>
    </section>
  )
}

// ---- Bloc 4 (legacy) : Templates premium (adaptatif) ---------------------

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

// ---- Buttons -------------------------------------------------------------

interface ButtonProps {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  loading?: boolean
}

interface BillingButtonProps extends ButtonProps {
  fullWidth?: boolean
}

function PrimaryButton({
  children,
  onClick,
  disabled,
  loading,
  fullWidth = false,
}: BillingButtonProps) {
  const t = useTranslations('billing')
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] px-5 text-sm font-semibold transition-colors duration-150',
        'bg-accent text-white hover:bg-accent-hover',
        'disabled:cursor-not-allowed disabled:bg-accent/40',
        fullWidth && 'w-full',
      )}
    >
      {loading ? t('ctaLoading') : children}
    </button>
  )
}

function SecondaryButton({
  children,
  onClick,
  disabled,
  loading,
  fullWidth = false,
}: BillingButtonProps) {
  const t = useTranslations('billing')
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-border bg-surface px-5 text-sm font-semibold text-foreground transition-colors duration-150',
        'hover:bg-surface-warm',
        'disabled:cursor-not-allowed disabled:text-muted-foreground',
        fullWidth && 'w-full',
      )}
    >
      {loading ? t('ctaLoading') : children}
    </button>
  )
}
