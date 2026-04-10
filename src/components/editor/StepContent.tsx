'use client'

import { cn } from '@/lib/utils'
import { ProjectsEditor } from './ProjectsEditor'
import { ContentBlocksEditor } from './ContentBlocksEditor'
import type { ProjectFormData } from '@/lib/validations'
import type { CustomBlock } from '@/types/custom-blocks'
import type { KpiItem } from '@/types/kpis'
import type { LayoutBlock } from '@/types/layout-blocks'

interface StepContentProps {
  projects: ProjectFormData[]
  onProjectsChange: (projects: ProjectFormData[]) => void
  customBlocks: CustomBlock[]
  onCustomBlocksChange: (blocks: CustomBlock[]) => void
  kpis: KpiItem[]
  onKpisChange: (kpis: KpiItem[]) => void
  layoutBlocks: LayoutBlock[]
  onLayoutBlocksChange: (blocks: LayoutBlock[]) => void
  className?: string
}

export function StepContent({
  projects, onProjectsChange,
  customBlocks, onCustomBlocksChange,
  kpis, onKpisChange,
  layoutBlocks, onLayoutBlocksChange,
  className,
}: StepContentProps) {
  return (
    <div className={cn(className)} data-testid="step-content">
      <div className="flex flex-col lg:flex-row lg:gap-12">
        <ProjectsEditor
          projects={projects}
          onProjectsChange={onProjectsChange}
        />
        <ContentBlocksEditor
          customBlocks={customBlocks}
          onCustomBlocksChange={onCustomBlocksChange}
          kpis={kpis}
          onKpisChange={onKpisChange}
          layoutBlocks={layoutBlocks}
          onLayoutBlocksChange={onLayoutBlocksChange}
        />
      </div>
    </div>
  )
}
