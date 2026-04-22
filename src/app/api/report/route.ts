import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/emails/send'
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit'

const reportSchema = z.object({
  category: z.enum([
    'copyright',
    'privacy',
    'hate',
    'illegal',
    'impersonation',
    'other',
  ]),
  url: z.string().url().max(500),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(10).max(5000),
})

const CATEGORY_LABEL: Record<z.infer<typeof reportSchema>['category'], string> = {
  copyright: 'Violation de droits d\'auteur / propriété intellectuelle',
  privacy: 'Atteinte à la vie privée / données personnelles',
  hate: 'Discours haineux, harcèlement ou menaces',
  illegal: 'Contenu manifestement illicite',
  impersonation: 'Usurpation d\'identité',
  other: 'Autre',
}

export async function POST(request: NextRequest) {
  try {
    const rl = rateLimit(getClientIdentifier(request), {
      key: 'report',
      limit: 3,
      windowMs: 10 * 60_000,
    })
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Trop de signalements envoyés, réessaye plus tard' },
        { status: 429 }
      )
    }

    const body: unknown = await request.json()
    const parsed = reportSchema.safeParse(body)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstIssue ? firstIssue.message : 'Données invalides' },
        { status: 400 }
      )
    }

    const { category, url, name, email, message } = parsed.data

    const formattedMessage = [
      `[SIGNALEMENT DSA]`,
      `Catégorie : ${CATEGORY_LABEL[category]}`,
      `URL signalée : ${url}`,
      ``,
      `Description :`,
      message,
    ].join('\n')

    const result = await sendEmail({
      template: 'contact-notification',
      to: 'tom@vizly.fr',
      replyTo: email,
      data: {
        senderName: `[Signalement] ${name}`,
        senderEmail: email,
        message: formattedMessage,
      },
    })

    if (!result.ok) {
      console.error('[Report] sendEmail error:', result.error)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne' },
      { status: 500 }
    )
  }
}
