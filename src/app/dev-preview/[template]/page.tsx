import { notFound } from 'next/navigation'
import { templateMap } from '@/components/templates'
import { getDemoPortfolio } from '@/lib/demo-data'
import type { TemplateName } from '@/types/templates'

interface PageProps {
  params: Promise<{ template: string }>
}

export default async function DevPreviewPage({ params }: PageProps) {
  const { template } = await params
  const Component = templateMap[template as TemplateName]
  if (!Component) notFound()

  const props = getDemoPortfolio(template, true)
  return <Component {...props} />
}
