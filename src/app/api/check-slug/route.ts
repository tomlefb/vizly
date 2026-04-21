import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { slugSchema } from '@/lib/validations'
import { getClientIdentifier, rateLimit } from '@/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    const rl = rateLimit(getClientIdentifier(request), {
      key: 'check-slug',
      limit: 30,
      windowMs: 60_000,
    })
    if (!rl.success) {
      return NextResponse.json(
        { available: false, message: 'Trop de requêtes, réessaye dans un instant' },
        { status: 429 }
      )
    }

    const { searchParams } = request.nextUrl
    const slug = searchParams.get('slug')

    if (!slug) {
      return NextResponse.json(
        { available: false, message: 'Le paramètre slug est requis' },
        { status: 400 }
      )
    }

    // Validate slug format
    const parsed = slugSchema.safeParse(slug)

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]
      return NextResponse.json(
        {
          available: false,
          message: firstIssue ? firstIssue.message : 'Slug invalide',
        },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Check authentication (optional — unauthenticated users can still check)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if slug is already taken
    const { data: existingPortfolio, error } = await supabase
      .from('portfolios')
      .select('id, user_id')
      .eq('slug', parsed.data)
      .limit(1)
      .maybeSingle()

    if (error) {
      return NextResponse.json(
        { available: false, message: 'Erreur lors de la vérification' },
        { status: 500 }
      )
    }

    // Slug is not taken
    if (!existingPortfolio) {
      return NextResponse.json(
        { available: true },
        { status: 200 }
      )
    }

    // Slug belongs to the current user — they can keep it
    if (user && existingPortfolio.user_id === user.id) {
      return NextResponse.json(
        { available: true },
        { status: 200 }
      )
    }

    // Slug is taken by someone else
    return NextResponse.json(
      { available: false, message: 'Ce pseudo est déjà pris' },
      { status: 200 }
    )
  } catch {
    return NextResponse.json(
      { available: false, message: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
