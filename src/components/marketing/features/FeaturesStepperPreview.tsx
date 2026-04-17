import { Fragment } from 'react'

const STEPS = [
  { label: 'Profil', active: true },
  { label: 'Contenu', active: false },
  { label: 'Design', active: false },
  { label: 'Publication', active: false },
]

export function FeaturesStepperPreview() {
  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => (
        <Fragment key={step.label}>
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
              {step.label}
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
