import { Resend } from 'resend'
import { render } from '@react-email/render'
import ContactNotificationEmail from '../../../emails/contact-notification'
import WelcomeEmail from '../../../emails/welcome'
import PortfolioPublishedEmail from '../../../emails/portfolio-published'
import PaymentSucceededEmail from '../../../emails/payment-succeeded'
import PlanChangedEmail from '../../../emails/plan-changed'
import BillingPeriodChangedEmail from '../../../emails/billing-period-changed'
import PaymentFailedEmail from '../../../emails/payment-failed'
import SubscriptionCancelledEmail from '../../../emails/subscription-cancelled'
import RenewalReminderEmail from '../../../emails/renewal-reminder'
import { getEmailStrings } from './i18n'
import type { SendEmailParams, SendEmailResult } from './types'

// Single Resend client. The API key is sending-only in production
// (see the production-send key created via the Resend MCP).
const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_HELLO = process.env.EMAIL_FROM_HELLO ?? 'Vizly <hello@vizly.fr>'
const FROM_BILLING = process.env.EMAIL_FROM_BILLING ?? 'Vizly <billing@vizly.fr>'
const REPLY_TO = process.env.EMAIL_REPLY_TO ?? 'hello@vizly.fr'

// RFC 5321 simple pattern : on refuse CR/LF et tout caractère de contrôle
// pour couper court à toute tentative d'injection de header via l'adresse.
const STRICT_EMAIL_REGEX = /^[^\s\r\n<>"'\0]+@[^\s\r\n<>"'\0]+\.[^\s\r\n<>"'\0]+$/

function sanitizeEmailAddress(raw: string | undefined): string | undefined {
  if (!raw) return undefined
  const trimmed = raw.trim()
  return STRICT_EMAIL_REGEX.test(trimmed) ? trimmed : undefined
}

interface RenderedTemplate {
  from: string
  subject: string
  html: string
}

/**
 * Type-safe transactional email sender.
 *
 * Failure policy: by design this never throws. Critical user flows
 * (signup, payment) must not fail because Resend is down — they should
 * log the error and continue. Callers that genuinely depend on delivery
 * (e.g. the contact form) check `result.ok` and react accordingly.
 */
export async function sendEmail(
  params: SendEmailParams,
): Promise<SendEmailResult> {
  try {
    const rendered = await renderTemplate(params)

    const safeTo = sanitizeEmailAddress(params.to)
    if (!safeTo) {
      return { ok: false, error: 'Invalid recipient address' }
    }
    const safeReplyTo =
      sanitizeEmailAddress(params.replyTo) ?? REPLY_TO

    const { data, error } = await resend.emails.send({
      from: rendered.from,
      to: safeTo,
      subject: rendered.subject,
      html: rendered.html,
      replyTo: safeReplyTo,
    })

    if (error) {
      console.error('[email] Resend error:', {
        template: params.template,
        to: params.to,
        message: error.message,
      })
      return { ok: false, error: error.message }
    }

    if (!data?.id) {
      return { ok: false, error: 'Resend returned no message id' }
    }

    return { ok: true, id: data.id }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown email error'
    console.error('[email] Unexpected error:', {
      template: params.template,
      to: params.to,
      message,
    })
    return { ok: false, error: message }
  }
}

async function renderTemplate(
  params: SendEmailParams,
): Promise<RenderedTemplate> {
  const locale = params.locale ?? 'fr'

  switch (params.template) {
    case 'contact-notification': {
      const html = await render(
        <ContactNotificationEmail data={params.data} locale={locale} />,
      )
      const { portfolioName, senderName } = params.data
      let subject: string
      if (portfolioName) {
        subject =
          locale === 'fr'
            ? `Nouveau message via ${portfolioName}`
            : `New message from ${portfolioName}`
      } else {
        subject =
          locale === 'fr'
            ? `[Vizly] Nouveau message de ${senderName}`
            : `[Vizly] New message from ${senderName}`
      }
      return { from: FROM_HELLO, subject, html }
    }

    case 'welcome': {
      const html = await render(
        <WelcomeEmail data={params.data} locale={locale} />,
      )
      const subject =
        locale === 'fr' ? 'Ton compte Vizly est prêt' : 'Your Vizly account is ready'
      return { from: FROM_HELLO, subject, html }
    }

    case 'portfolio-published': {
      const html = await render(
        <PortfolioPublishedEmail data={params.data} locale={locale} />,
      )
      const subject =
        locale === 'fr' ? 'Ton portfolio est en ligne' : 'Your portfolio is live'
      return { from: FROM_HELLO, subject, html }
    }

    case 'payment-succeeded': {
      const html = await render(
        <PaymentSucceededEmail data={params.data} locale={locale} />,
      )
      const subject =
        locale === 'fr'
          ? `Paiement reçu — Vizly ${params.data.planName}`
          : `Payment received — Vizly ${params.data.planName}`
      return { from: FROM_BILLING, subject, html }
    }

    case 'plan-changed': {
      const html = await render(
        <PlanChangedEmail data={params.data} locale={locale} />,
      )
      // Unified subject with arrow direction — same format for upgrade and
      // downgrade, the data tells the story. Compact and scannable in inbox.
      const subject =
        locale === 'fr'
          ? `Plan mis à jour — ${params.data.previousPlanName} → ${params.data.newPlanName}`
          : `Plan updated — ${params.data.previousPlanName} → ${params.data.newPlanName}`
      return { from: FROM_BILLING, subject, html }
    }

    case 'billing-period-changed': {
      const html = await render(
        <BillingPeriodChangedEmail data={params.data} locale={locale} />,
      )
      // Read the localised period labels from the same i18n strings the
      // template uses so the subject matches the body without duplicating
      // the FR/EN strings here in send.tsx.
      const t = getEmailStrings(locale).billingPeriodChanged
      const previousLabel =
        params.data.previousBillingPeriod === 'yearly'
          ? t.valueBillingYearly
          : t.valueBillingMonthly
      const newLabel =
        params.data.newBillingPeriod === 'yearly'
          ? t.valueBillingYearly
          : t.valueBillingMonthly
      const subject =
        locale === 'fr'
          ? `Facturation mise à jour — ${previousLabel} → ${newLabel}`
          : `Billing cycle updated — ${previousLabel} → ${newLabel}`
      return { from: FROM_BILLING, subject, html }
    }

    case 'payment-failed': {
      const html = await render(
        <PaymentFailedEmail data={params.data} locale={locale} />,
      )
      const subject =
        locale === 'fr'
          ? `Paiement échoué — Vizly ${params.data.planName}`
          : `Payment failed — Vizly ${params.data.planName}`
      return { from: FROM_BILLING, subject, html }
    }

    case 'subscription-cancelled': {
      const html = await render(
        <SubscriptionCancelledEmail data={params.data} locale={locale} />,
      )
      const subject =
        locale === 'fr'
          ? `Fin d'abonnement — Vizly ${params.data.previousPlanName}`
          : `Subscription ending — Vizly ${params.data.previousPlanName}`
      return { from: FROM_BILLING, subject, html }
    }

    case 'renewal-reminder': {
      const html = await render(
        <RenewalReminderEmail data={params.data} locale={locale} />,
      )
      // Subject mirrors the Apple-style pattern: specific date in the subject
      // so the user sees "when" without opening. Same "{Event} — Vizly {plan}"
      // family format used by plan-changed and subscription-cancelled.
      const formattedDate = new Intl.DateTimeFormat(
        locale === 'fr' ? 'fr-FR' : 'en-US',
        { dateStyle: 'long', timeZone: 'UTC' },
      ).format(new Date(params.data.renewalDate))
      const subject =
        locale === 'fr'
          ? `Renouvellement le ${formattedDate} — Vizly ${params.data.planName}`
          : `Renewal on ${formattedDate} — Vizly ${params.data.planName}`
      return { from: FROM_BILLING, subject, html }
    }

    default: {
      const _exhaustive: never = params
      throw new Error(
        `[email] Unknown template: ${JSON.stringify(_exhaustive)}`,
      )
    }
  }
}

// Document which "from" addresses each template will use once Phase 3 lands.
// Kept as a const for visibility — actually used inside the switch above.
export const TEMPLATE_FROM_SCOPE = {
  welcome: FROM_HELLO,
  'portfolio-published': FROM_HELLO,
  'contact-notification': FROM_HELLO,
  'payment-succeeded': FROM_BILLING,
  'plan-changed': FROM_BILLING,
  'billing-period-changed': FROM_BILLING,
  'payment-failed': FROM_BILLING,
  'subscription-cancelled': FROM_BILLING,
  'renewal-reminder': FROM_BILLING,
} as const

// Re-export so callers can `import { sendEmail } from '@/lib/emails/send'`
// or pull types from the same module.
export type { SendEmailParams, SendEmailResult } from './types'
