import { z } from 'zod'
import {
  DEFAULT_PORTFOLIO_COLOR,
  MAX_BIO_LENGTH,
  MAX_PROJECT_DESCRIPTION_LENGTH,
  SLUG_MIN_LENGTH,
  SLUG_MAX_LENGTH,
  SOCIAL_PLATFORMS,
} from './constants'

export const slugSchema = z
  .string()
  .min(SLUG_MIN_LENGTH, `Le pseudo doit contenir au moins ${SLUG_MIN_LENGTH} caractères`)
  .max(SLUG_MAX_LENGTH, `Le pseudo ne peut pas dépasser ${SLUG_MAX_LENGTH} caractères`)
  .regex(
    /^[a-z0-9][a-z0-9-]*[a-z0-9]$/,
    'Le pseudo ne peut contenir que des lettres minuscules, chiffres et tirets'
  )
  .refine((s) => !s.includes('--'), 'Le pseudo ne peut pas contenir deux tirets consécutifs')

export const socialLinksSchema = z
  .partialRecord(z.enum(SOCIAL_PLATFORMS), z.string().or(z.literal('')))
  .optional()

const sectionBlockSchema = z.object({
  id: z.string().min(1),
  visible: z.boolean(),
  order: z.number().int().min(0),
})

export const portfolioSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(100),
  bio: z.string().max(MAX_BIO_LENGTH).optional(),
  photo_url: z.string().optional().or(z.literal('')),
  template: z.string().min(1, 'Choisis un template'),
  primary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide')
    .default(DEFAULT_PORTFOLIO_COLOR),
  secondary_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide')
    .default('#1A1A1A'),
  background_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide')
    .default('#FFFFFF'),
  font: z.string().default('DM Sans'),
  font_body: z.string().default('DM Sans'),
  social_links: socialLinksSchema,
  contact_email: z.string().optional().or(z.literal('')),
  skills: z.array(z.string().max(50)).max(30).default([]),
  sections: z.array(sectionBlockSchema).optional(),
  layout_blocks: z.array(z.object({
    id: z.string(),
    columnCount: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    columns: z.array(z.object({
      type: z.string(),
      title: z.string().max(200).optional(),
      content: z.string().max(10000).optional(),
      kpi: z.any().optional(),
      imageUrl: z.string().optional(),
      imageAlt: z.string().max(200).optional(),
    })),
  })).max(20).optional(),
  kpis: z.array(z.object({
    id: z.string(),
    type: z.string(),
    label: z.string().max(200),
    value: z.number(),
    maxValue: z.number().default(100),
    unit: z.string().max(20).default(''),
    secondaryValue: z.number().optional(),
    secondaryLabel: z.string().max(200).optional(),
    dataPoints: z.array(z.object({ label: z.string(), value: z.number() })).optional(),
  })).max(20).optional(),
  custom_blocks: z.array(z.object({
    id: z.string(),
    title: z.string().max(200),
    subtitle: z.string().max(200).default(''),
    content: z.string().max(10000),
    order: z.number().int().min(0).default(0),
  })).max(20).optional(),
})

export const projectSchema = z.object({
  title: z.string().min(1, 'Le titre du projet est requis').max(100),
  description: z
    .string()
    .max(MAX_PROJECT_DESCRIPTION_LENGTH)
    .optional()
    .or(z.literal('')),
  images: z.array(z.string().url()).max(5).default([]),
  external_link: z.string().url().optional().or(z.literal('')),
  tags: z.array(z.string().max(30)).max(10).default([]),
  display_order: z.number().int().min(0).default(0),
})

export const contactFormSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  email: z.string().email('Email invalide'),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères').max(2000),
})

export type PortfolioFormData = z.infer<typeof portfolioSchema>
export type ProjectFormData = z.infer<typeof projectSchema>
export type ContactFormData = z.infer<typeof contactFormSchema>
