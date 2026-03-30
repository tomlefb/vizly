import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const rootDomain = process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr'

  // Extract subdomain
  const subdomain = hostname.replace(`.${rootDomain}`, '').replace(`:${request.nextUrl.port}`, '')

  // If it's the main domain, www, vercel.app, or localhost, continue normally
  if (
    subdomain === 'www' ||
    subdomain === rootDomain ||
    hostname === rootDomain ||
    hostname === 'localhost' ||
    hostname.startsWith('localhost:') ||
    hostname.endsWith('.vercel.app')
  ) {
    return await updateSession(request)
  }

  // Rewrite subdomain to /portfolio/[slug]
  const url = request.nextUrl.clone()
  url.pathname = `/portfolio/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
  return NextResponse.rewrite(url)
}

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

  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|images/|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
