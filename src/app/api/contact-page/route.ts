import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { resend, FROM_EMAIL } from '@/lib/resend/client'

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

    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: 'tom@vizly.fr',
      replyTo: email,
      subject: `[Vizly Contact] Message de ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\n\nMessage:\n${message}`,
    })

    if (error) {
      console.error('[Contact Page] Resend error:', error)
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
