import { Fragment } from 'react'
import { getTranslations } from 'next-intl/server'

const STEPS = [
  { key: 'profile', active: true },
  { key: 'content', active: false },
  { key: 'design', active: false },
  { key: 'publish', active: false },
] as const

export async function FeaturesStepperPreview() {
  const t = await getTranslations('fonctionnalites.mockup.stepper')

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => (
        <Fragment key={step.key}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                step.active ? 'bg-accent-deep' : 'bg-border'
              }`}
            />
            <span
              className={`text-xs font-medium whitespace-nowrap ${
                step.active ? 'text-foreground' : 'text-muted'
              }`}
            >
              {t(step.key)}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className="w-8 h-px bg-border-light mt-[5px]" />
          )}
        </Fragment>
      ))}
    </div>
  )
}
