import { notFound } from 'next/navigation'
import { templateMap } from '@/components/templates'
import { DEMO_PORTFOLIO, DEMO_COLORS } from '@/lib/demo-data'
import type { TemplateName } from '@/types/templates'

interface PageProps {
  params: Promise<{ template: string }>
}

export default async function DevPreviewPage({ params }: PageProps) {
  const { template } = await params
  const Component = templateMap[template as TemplateName]
  if (!Component) notFound()

  const colors = DEMO_COLORS[template] ?? { primary: '#D4634E', secondary: '#1A1A1A' }

  const props = {
    ...DEMO_PORTFOLIO,
    portfolio: {
      ...DEMO_PORTFOLIO.portfolio,
      primary_color: colors.primary,
      secondary_color: colors.secondary,
    },
    isPremium: true,
  }

  return <Component {...props} />
}
