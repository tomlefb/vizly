import type { ComponentType } from 'react'
import type { TemplateProps } from '@/types'
import { TemplateMinimal } from './TemplateMinimal'
import { TemplateDark } from './TemplateDark'
import { TemplateClassique } from './TemplateClassique'
import { TemplateColore } from './TemplateColore'
import { TemplateCreatif } from './TemplateCreatif'
import { TemplateBrutalist } from './TemplateBrutalist'
import { TemplateElegant } from './TemplateElegant'
import { TemplateBento } from './TemplateBento'

export const templateMap: Record<string, ComponentType<TemplateProps>> = {
  minimal: TemplateMinimal,
  dark: TemplateDark,
  classique: TemplateClassique,
  colore: TemplateColore,
  creatif: TemplateCreatif,
  brutalist: TemplateBrutalist,
  elegant: TemplateElegant,
  bento: TemplateBento,
}

// Re-export individual templates
export {
  TemplateMinimal,
  TemplateDark,
  TemplateClassique,
  TemplateColore,
  TemplateCreatif,
  TemplateBrutalist,
  TemplateElegant,
  TemplateBento,
}
