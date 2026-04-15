import { NextResponse, type NextRequest } from 'next/server'
import { contactFormSchema } from '@/lib/validations'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/emails/send'
import { z } from 'zod'

/**
 * Contact form submission.
 * Public route -- uses admin client (no user session).
 * Only delivers emails when the portfolio owner is on the Pro plan.
 */

const contactBodySchema = contactFormSchema.extend({
  slug: z.string().min(1, 'Le slug est requis'),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()

    // 1. Validate input
    const parsed = contactBodySchema.safeParse(body)
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstIssue ? firstIssue.message : 'Donnees invalides' },
        { status: 400 }
      )
    }

    const { name, email, message, slug } = parsed.data

    const supabase = createAdminClient()

    // 2. Find the portfolio by slug
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('id, user_id, title')
      .eq('slug', slug)
      .eq('published', true)
      .limit(1)
      .maybeSingle()

    if (portfolioError) {
      console.error('[Contact] DB error looking up portfolio:', portfolioError.message)
      return NextResponse.json(
        { error: 'Erreur interne' },
        { status: 500 }
      )
    }

    if (!portfolio) {
      return NextResponse.json(
        { error: 'Portfolio introuvable' },
        { status: 404 }
      )
    }

    // 3. Get the portfolio owner and verify Pro plan
    const { data: owner, error: ownerError } = await supabase
      .from('users')
      .select('id, email, name, plan')
      .eq('id', portfolio.user_id)
      .single()

    if (ownerError || !owner) {
      console.error('[Contact] DB error looking up owner:', ownerError?.message)
      return NextResponse.json(
        { error: 'Erreur interne' },
        { status: 500 }
      )
    }

    if (owner.plan !== 'pro') {
      return NextResponse.json(
        { error: 'Le formulaire de contact est reserve au plan Pro' },
        { status: 403 }
      )
    }

    // 4. Send the contact notification email
    const result = await sendEmail({
      template: 'contact-notification',
      to: owner.email,
      replyTo: email,
      data: {
        portfolioName: portfolio.title,
        senderName: name,
        senderEmail: email,
        message,
      },
    })

    if (!result.ok) {
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Message envoyé avec succès' },
      { status: 200 }
    )
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Erreur interne'
    console.error('[Contact] Unexpected error:', errorMessage)
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
