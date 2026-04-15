import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'

  // Extract subdomain
  const subdomain = hostname.replace(`.${rootDomain}`, '').replace(`:${request.nextUrl.port}`, '')

  // If it's the main domain, www, or localhost, continue normally
  if (
    subdomain === 'www' ||
    subdomain === rootDomain ||
    hostname === rootDomain ||
    hostname === 'localhost' ||
    hostname.startsWith('localhost:') ||
    hostname.endsWith('.railway.app')
  ) {
    return await updateSession(request)
  }

  // Rewrite subdomain to /portfolio/[slug]
  const url = request.nextUrl.clone()
  url.pathname = `/portfolio/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
  return NextResponse.rewrite(url)
}

const AUTH_ROUTES = ['/login', '/register', '/forgot-password']

async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Already-authenticated users landing on /login, /register or
  // /forgot-password are bounced to /dashboard. Preserves the plan /
  // interval query params used by getDashboardUrl so a marketing CTA
  // like /login?plan=pro still opens the checkout modal post-redirect.
  if (user && AUTH_ROUTES.includes(request.nextUrl.pathname)) {
    const target = request.nextUrl.clone()
    target.pathname = '/dashboard'
    return NextResponse.redirect(target)
  }

  // Expose pathname to server components via a header so the dashboard
  // layout can compute route-specific defaults (e.g., collapsed sidebar
  // for /editor) without a client-side flicker at F5.
  response.headers.set('x-pathname', request.nextUrl.pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
