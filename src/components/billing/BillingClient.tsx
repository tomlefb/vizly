'use client'

import { useState, useCallback } from 'react'
import {
  Check,
  Loader2,
  CreditCard,
  ExternalLink,
  Sparkles,
  Lock,
  Crown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createSubscriptionCheckoutAction,
  createTemplateCheckoutAction,
  createBillingPortalAction,
} from '@/actions/billing'
import { PLANS } from '@/lib/constants'
import { TEMPLATE_CONFIGS } from '@/types/templates'
import type { TemplateName } from '@/types/templates'

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

interface BillingClientProps {
  plan: 'free' | 'starter' | 'pro'
  purchasedTemplates: string[]
  checkoutStatus?: 'success' | 'cancel' | null
}

type LoadingAction =
  | 'checkout-starter'
  | 'checkout-pro'
  | 'portal'
  | `template-${string}`
  | null

// ------------------------------------------------------------------
// Component
// ------------------------------------------------------------------

export function BillingClient({
  plan,
  purchasedTemplates,
  checkoutStatus,
}: BillingClientProps) {
  const [loadingAction, setLoadingAction] = useState<LoadingAction>(null)
  const [error, setError] = useState<string | null>(null)

  // ---- Handlers ---------------------------------------------------

  const handleSubscriptionCheckout = useCallback(
    async (targetPlan: 'starter' | 'pro') => {
      const actionKey = `checkout-${targetPlan}` as LoadingAction
      setLoadingAction(actionKey)
      setError(null)

      const result = await createSubscriptionCheckoutAction(targetPlan)

      if (result.error) {
        setError(result.error)
        setLoadingAction(null)
        return
      }

      if (result.url) {
        window.location.href = result.url
      }
    },
    []
  )

  const handleBillingPortal = useCallback(async () => {
    setLoadingAction('portal')
    setError(null)

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

  const handleTemplatePurchase = useCallback(
    async (templateId: string) => {
      setLoadingAction(`template-${templateId}`)
      setError(null)

      const result = await createTemplateCheckoutAction(templateId)

      if (result.error) {
        setError(result.error)
        setLoadingAction(null)
        return
      }

      if (result.url) {
        window.location.href = result.url
      }
    },
    []
  )

  // ---- Plan display info ------------------------------------------

  const planInfo = PLANS[plan]
  const premiumTemplates = TEMPLATE_CONFIGS.filter((t) => t.isPremium)

  const planBadgeStyles: Record<string, string> = {
    free: 'bg-muted/50 text-muted-foreground',
    starter: 'bg-accent/10 text-accent',
    pro: 'bg-amber-100 text-amber-800',
  }

  return (
    <div className="space-y-8">
      {/* Checkout status banners */}
      {checkoutStatus === 'success' && (
        <div className="rounded-[var(--radius-lg)] border border-green-200 bg-green-50/80 p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-100">
            <Check className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-green-800">
              Paiement confirme
            </p>
            <p className="text-xs text-green-700 mt-0.5">
              Ton abonnement est actif. Les changements peuvent prendre quelques instants.
            </p>
          </div>
        </div>
      )}
      {checkoutStatus === 'cancel' && (
        <div className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/80 p-4 flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-800">
              Paiement annule
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Le paiement a ete annule. Tu peux reessayer a tout moment.
            </p>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="rounded-[var(--radius-lg)] border border-destructive/20 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">{error}</p>
        </div>
      )}

      {/* Current plan card */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Mon abonnement
        </h2>

        <div className="rounded-[var(--radius-lg)] border border-border bg-surface p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {plan === 'pro' ? (
                <Crown className="h-5 w-5 text-amber-500" />
              ) : (
                <CreditCard className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <h3 className="text-base font-semibold text-foreground">
                  Plan {planInfo.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {planInfo.price === 0
                    ? 'Gratuit'
                    : `${planInfo.price.toFixed(2)} EUR/mois`}
                </p>
              </div>
            </div>
            <span
              className={cn(
                'inline-flex items-center rounded-[var(--radius-full)] px-3 py-1 text-xs font-semibold uppercase tracking-wide',
                planBadgeStyles[plan]
              )}
            >
              {planInfo.name}
            </span>
          </div>

          {/* Feature list */}
          <ul className="space-y-2" aria-label="Fonctionnalites du plan">
            {planInfo.features.map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-sm text-foreground">
                <Check className="h-3.5 w-3.5 text-accent shrink-0" />
                {feature}
              </li>
            ))}
            {planInfo.limitations.map((limitation) => (
              <li
                key={limitation}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Lock className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                {limitation}
              </li>
            ))}
          </ul>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            {plan === 'free' && (
              <>
                <button
                  type="button"
                  onClick={() => void handleSubscriptionCheckout('starter')}
                  disabled={loadingAction !== null}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                    loadingAction === 'checkout-starter'
                      ? 'bg-accent/40 text-white/60 cursor-not-allowed'
                      : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(212,99,78,0.2)]'
                  )}
                >
                  {loadingAction === 'checkout-starter' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    'Passer au Starter (4.99 EUR/mois)'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleSubscriptionCheckout('pro')}
                  disabled={loadingAction !== null}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                    loadingAction === 'checkout-pro'
                      ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                      : 'border-border text-foreground hover:bg-surface-warm active:scale-[0.98]'
                  )}
                >
                  {loadingAction === 'checkout-pro' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    'Passer au Pro (9.99 EUR/mois)'
                  )}
                </button>
              </>
            )}

            {plan === 'starter' && (
              <>
                <button
                  type="button"
                  onClick={() => void handleSubscriptionCheckout('pro')}
                  disabled={loadingAction !== null}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[var(--radius-md)] px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                    loadingAction === 'checkout-pro'
                      ? 'bg-accent/40 text-white/60 cursor-not-allowed'
                      : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(212,99,78,0.2)]'
                  )}
                >
                  {loadingAction === 'checkout-pro' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    'Passer au Pro (9.99 EUR/mois)'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => void handleBillingPortal()}
                  disabled={loadingAction !== null}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                    loadingAction === 'portal'
                      ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                      : 'border-border text-foreground hover:bg-surface-warm active:scale-[0.98]'
                  )}
                >
                  {loadingAction === 'portal' ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Redirection...
                    </>
                  ) : (
                    <>
                      Gerer mon abonnement
                      <ExternalLink className="h-3.5 w-3.5" />
                    </>
                  )}
                </button>
              </>
            )}

            {plan === 'pro' && (
              <button
                type="button"
                onClick={() => void handleBillingPortal()}
                disabled={loadingAction !== null}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-5 py-2.5 text-sm font-semibold transition-all duration-200',
                  loadingAction === 'portal'
                    ? 'border-border text-muted-foreground/40 cursor-not-allowed'
                    : 'border-border text-foreground hover:bg-surface-warm active:scale-[0.98]'
                )}
              >
                {loadingAction === 'portal' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Redirection...
                  </>
                ) : (
                  <>
                    Gerer mon abonnement
                    <ExternalLink className="h-3.5 w-3.5" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Premium templates section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
            Templates premium
          </h2>
          <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-accent/10 px-2 py-0.5 text-[10px] font-semibold text-accent uppercase tracking-wide">
            <Sparkles className="h-3 w-3" />
            2.99 EUR
          </span>
        </div>

        {plan === 'free' && (
          <p className="text-sm text-muted-foreground">
            Les templates premium sont disponibles avec un abonnement Starter ou Pro.
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {premiumTemplates.map((template) => {
            const isPurchased = purchasedTemplates.includes(template.name)
            const isLoadingThis = loadingAction === `template-${template.name}`
            const canBuy = plan !== 'free' && !isPurchased

            return (
              <div
                key={template.name}
                className={cn(
                  'rounded-[var(--radius-lg)] border p-4 transition-colors duration-150',
                  isPurchased
                    ? 'border-accent/20 bg-accent/[0.03]'
                    : 'border-border bg-surface'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">
                        {template.label}
                      </h3>
                      {isPurchased && (
                        <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-accent/10 px-1.5 py-0.5 text-[9px] font-bold text-accent uppercase tracking-wider">
                          <Check className="h-2.5 w-2.5" />
                          Achete
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {template.description}
                    </p>
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      Ideal pour : {template.idealFor}
                    </p>
                  </div>
                </div>

                {canBuy && (
                  <button
                    type="button"
                    onClick={() => void handleTemplatePurchase(template.name)}
                    disabled={loadingAction !== null}
                    className={cn(
                      'mt-3 inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-xs font-semibold transition-all duration-200',
                      isLoadingThis
                        ? 'bg-accent/40 text-white/60 cursor-not-allowed'
                        : 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(212,99,78,0.15)]'
                    )}
                  >
                    {isLoadingThis ? (
                      <>
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Redirection...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3 w-3" />
                        Acheter (2.99 EUR)
                      </>
                    )}
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
