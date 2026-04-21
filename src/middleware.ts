import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Trois types de hôtes possibles :
//
//   1. Vizly "racine" : vizly.fr, www.vizly.fr, localhost, *.up.railway.app
//      → flux standard (updateSession), l'app-web tourne dessus
//
//   2. Subdomain Vizly : <pseudo>.vizly.fr
//      → rewrite interne vers /portfolio/<pseudo>
//
//   3. Custom domain d'un user Pro : portfolio.monsite.com
//      → lookup DB portfolios.custom_domain, rewrite vers /portfolio/<slug>
//      uniquement si custom_domain_status='verified' ET published=true
//
// Les domaines custom ne servent QUE des portfolios publics (pas d'auth, pas
// de dashboard dessus), donc on ne passe pas par updateSession sur eux.

export async function middleware(request: NextRequest) {
  const rawHost = (request.headers.get('host') ?? '').toLowerCase()
  const hostname = rawHost.replace(/:\d+$/, '')
  const rootDomain = (process.env.NEXT_PUBLIC_APP_DOMAIN ?? 'vizly.fr').toLowerCase()

  const isVizlyRoot =
    hostname === rootDomain || hostname === `www.${rootDomain}`
  const isVizlySubdomain =
    hostname.endsWith(`.${rootDomain}`) && !isVizlyRoot
  const isLocalhost =
    hostname === 'localhost' || hostname === '127.0.0.1'
  const isRailwayInternal = hostname.endsWith('.railway.app') || hostname.endsWith('.up.railway.app')

  // --- 1. Hôte app-web : flux session normal ---
  if (isVizlyRoot || isLocalhost || isRailwayInternal) {
    return await updateSession(request)
  }

  // Les routes techniques (/api/*, /_next/*) doivent être servies
  // directement par l'app-web quelle que soit l'origine — sans ça, un POST
  // depuis pseudo.vizly.fr/api/contact serait réécrit en
  // /portfolio/pseudo/api/contact qui n'existe pas (404 → formulaire ko).
  const isTechnicalRoute =
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/')

  // --- 2. Subdomain Vizly : rewrite vers /portfolio/<subdomain> ---
  if (isVizlySubdomain) {
    if (isTechnicalRoute) return NextResponse.next()
    const subdomain = hostname.replace(`.${rootDomain}`, '')
    const url = request.nextUrl.clone()
    url.pathname = `/portfolio/${subdomain}${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // --- 3. Custom domain : lookup DB puis rewrite si verified+published ---
  if (isTechnicalRoute) return NextResponse.next()
  const slug = await resolveCustomDomainSlug(hostname, request)
  if (slug) {
    const url = request.nextUrl.clone()
    url.pathname = `/portfolio/${slug}${url.pathname === '/' ? '' : url.pathname}`
    return NextResponse.rewrite(url)
  }

  // Hôte inconnu : laisse la chaîne Next.js gérer (→ 404 par défaut).
  return NextResponse.next()
}

async function resolveCustomDomainSlug(
  domain: string,
  request: NextRequest,
): Promise<string | null> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '',
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll() {
          // read-only query, pas de setAll nécessaire
        },
      },
    },
  )

  const { data } = await supabase
    .from('portfolios')
    .select('slug')
    .eq('custom_domain', domain)
    .eq('custom_domain_status', 'verified')
    .eq('published', true)
    .maybeSingle()

  return data?.slug ?? null
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
    const target = new URL('/dashboard', request.url)
    target.search = request.nextUrl.search
    return NextResponse.redirect(target, 307)
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
