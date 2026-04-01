import { resend, FROM_EMAIL } from './client'
import { APP_URL } from '@/lib/constants'

// ---------------------------------------------------------------------------
// Shared HTML helpers
// ---------------------------------------------------------------------------

const ACCENT_COLOR = '#D4634E'

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background-color:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#f5f5f3;padding:40px 0;">
    <tr>
      <td align="center">
        <table role="presentation" cellpadding="0" cellspacing="0" width="560" style="max-width:560px;width:100%;background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="padding:32px 40px 24px 40px;">
              <span style="font-size:22px;font-weight:700;color:#1A1A1A;letter-spacing:-0.02em;">Vizly</span>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:0 40px 32px 40px;color:#1A1A1A;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;border-top:1px solid #E8E6DC;color:#9B9B9B;font-size:13px;line-height:1.5;">
              Vizly &mdash; <a href="${APP_URL}" style="color:#9B9B9B;text-decoration:underline;">vizly.fr</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

function ctaButton(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
  <tr>
    <td style="background-color:${ACCENT_COLOR};border-radius:6px;">
      <a href="${href}" style="display:inline-block;padding:12px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
        ${label}
      </a>
    </td>
  </tr>
</table>`
}

// ---------------------------------------------------------------------------
// Email: Welcome
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(params: {
  to: string
  name: string
}): Promise<{ error: string | null }> {
  try {
    const displayName = params.name || 'there'
    const html = emailWrapper(`
      <p style="font-size:18px;font-weight:600;margin:0 0 16px 0;">
        Bienvenue sur Vizly, ${displayName} !
      </p>
      <p style="margin:0 0 8px 0;">
        Ton compte est pret. Tu peux maintenant creer ton portfolio en quelques minutes : choisis un template, ajoute tes projets, et publie-le.
      </p>
      ${ctaButton('Creer mon portfolio', `${APP_URL}/editor`)}
      <p style="margin:0;color:#6B6B6B;font-size:14px;">
        Si tu as des questions, reponds simplement a cet email.
      </p>
    `)

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: 'Bienvenue sur Vizly !',
      html,
    })

    if (error) {
      console.error('[Resend] Failed to send welcome email:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur envoi email bienvenue'
    console.error('[Resend] sendWelcomeEmail error:', message)
    return { error: message }
  }
}

// ---------------------------------------------------------------------------
// Email: Contact notification (Pro plan)
// ---------------------------------------------------------------------------

export async function sendContactNotification(params: {
  to: string
  portfolioName: string
  senderName: string
  senderEmail: string
  message: string
}): Promise<{ error: string | null }> {
  try {
    const html = emailWrapper(`
      <p style="font-size:18px;font-weight:600;margin:0 0 16px 0;">
        Nouveau message via ton portfolio
      </p>
      <p style="margin:0 0 16px 0;">
        Quelqu'un t'a contacte via <strong>${params.portfolioName}</strong>.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color:#FAFAF8;border:1px solid #E8E6DC;border-radius:6px;margin:0 0 16px 0;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 8px 0;font-size:14px;color:#6B6B6B;">
              <strong style="color:#1A1A1A;">De :</strong> ${params.senderName} &lt;${params.senderEmail}&gt;
            </p>
            <p style="margin:0;font-size:14px;color:#1A1A1A;white-space:pre-wrap;">${params.message}</p>
          </td>
        </tr>
      </table>
      <p style="margin:0;color:#6B6B6B;font-size:14px;">
        Tu peux repondre directement a <a href="mailto:${params.senderEmail}" style="color:${ACCENT_COLOR};text-decoration:underline;">${params.senderEmail}</a>.
      </p>
    `)

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: 'Nouveau message via ton portfolio',
      replyTo: params.senderEmail,
      html,
    })

    if (error) {
      console.error('[Resend] Failed to send contact notification:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur envoi notification contact'
    console.error('[Resend] sendContactNotification error:', message)
    return { error: message }
  }
}

// ---------------------------------------------------------------------------
// Email: Expiration reminder
// ---------------------------------------------------------------------------

export async function sendExpirationReminder(params: {
  to: string
  name: string
  daysLeft: number
}): Promise<{ error: string | null }> {
  try {
    const displayName = params.name || 'there'
    const daysLabel = params.daysLeft === 1 ? 'jour' : 'jours'
    const html = emailWrapper(`
      <p style="font-size:18px;font-weight:600;margin:0 0 16px 0;">
        Ton abonnement expire dans ${params.daysLeft} ${daysLabel}
      </p>
      <p style="margin:0 0 8px 0;">
        Salut ${displayName}, ton abonnement Vizly arrive a expiration bientot. Si ton paiement n'est pas renouvele, ton portfolio sera mis hors ligne.
      </p>
      <p style="margin:0 0 8px 0;">
        Verifie que ton moyen de paiement est a jour pour continuer a profiter de ton portfolio en ligne.
      </p>
      ${ctaButton('Gerer mon abonnement', `${APP_URL}/billing`)}
      <p style="margin:0;color:#6B6B6B;font-size:14px;">
        Si tu as des questions, reponds simplement a cet email.
      </p>
    `)

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: 'Ton abonnement Vizly expire bientot',
      html,
    })

    if (error) {
      console.error('[Resend] Failed to send expiration reminder:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur envoi rappel expiration'
    console.error('[Resend] sendExpirationReminder error:', message)
    return { error: message }
  }
}

// ---------------------------------------------------------------------------
// Email: Offline warning
// ---------------------------------------------------------------------------

export async function sendOfflineWarning(params: {
  to: string
  name: string
  portfolioSlug: string
}): Promise<{ error: string | null }> {
  try {
    const displayName = params.name || 'there'
    const html = emailWrapper(`
      <p style="font-size:18px;font-weight:600;margin:0 0 16px 0;">
        Ton portfolio a ete mis hors ligne
      </p>
      <p style="margin:0 0 8px 0;">
        Salut ${displayName}, le paiement de ton abonnement Vizly a echoue. Ton portfolio <strong>${params.portfolioSlug}.vizly.fr</strong> n'est plus accessible au public.
      </p>
      <p style="margin:0 0 8px 0;">
        Pas de panique : toutes tes donnees sont conservees. Mets a jour ton moyen de paiement pour remettre ton portfolio en ligne immediatement.
      </p>
      ${ctaButton('Reactiver mon portfolio', `${APP_URL}/billing`)}
      <p style="margin:0;color:#6B6B6B;font-size:14px;">
        Si tu penses qu'il s'agit d'une erreur, reponds simplement a cet email.
      </p>
    `)

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: params.to,
      subject: 'Ton portfolio a ete mis hors ligne',
      html,
    })

    if (error) {
      console.error('[Resend] Failed to send offline warning:', error)
      return { error: error.message }
    }

    return { error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur envoi avertissement hors ligne'
    console.error('[Resend] sendOfflineWarning error:', message)
    return { error: message }
  }
}
