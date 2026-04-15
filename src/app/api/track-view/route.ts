import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'

const trackViewSchema = z.object({
  portfolio_id: z.string().uuid(),
})

// In-memory dedup: key = "ip:portfolio_id", value = timestamp
const recentViews = new Map<string, number>()
const ONE_HOUR_MS = 60 * 60 * 1000

function cleanupOldEntries() {
  const now = Date.now()
  for (const [key, timestamp] of recentViews) {
    if (now - timestamp > ONE_HOUR_MS) {
      recentViews.delete(key)
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = trackViewSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      )
    }

    const { portfolio_id } = parsed.data

    // Get IP from headers (x-forwarded-for is set by the reverse proxy)
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0]?.trim() : 'unknown'
    const dedupKey = `${ip ?? 'unknown'}:${portfolio_id}`

    // Cleanup old entries periodically
    cleanupOldEntries()

    // Check dedup: one view per IP per portfolio per hour
    const lastView = recentViews.get(dedupKey)
    if (lastView && Date.now() - lastView < ONE_HOUR_MS) {
      return NextResponse.json({ ok: true, deduplicated: true })
    }

    // Record the view timestamp for dedup
    recentViews.set(dedupKey, Date.now())

    const supabase = createAdminClient()

    const referrer = request.headers.get('referer') ?? null

    const { error } = await supabase.from('page_views').insert({
      portfolio_id,
      referrer,
    })

    if (error) {
      // Remove dedup entry if insert failed so it can be retried
      recentViews.delete(dedupKey)
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
