import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { sendEmail } from '@/lib/emails/send'

const contactSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  message: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = contactSchema.safeParse(body)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return NextResponse.json(
        { error: firstIssue ? firstIssue.message : 'Donnees invalides' },
        { status: 400 }
      )
    }

    const { name, email, message } = parsed.data

    const result = await sendEmail({
      template: 'contact-notification',
      to: 'tom@vizly.fr',
      replyTo: email,
      data: {
        senderName: name,
        senderEmail: email,
        message,
      },
    })

    if (!result.ok) {
      console.error('[Contact Page] sendEmail error:', result.error)
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
