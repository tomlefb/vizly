const STEPS = [
  { label: 'Profil', active: true },
  { label: 'Contenu', active: false },
  { label: 'Design', active: false },
  { label: 'Publication', active: false },
]

export function FeaturesStepperPreview() {
  return (
    <div className="flex flex-col">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div
              className={`w-3 h-3 rounded-full shrink-0 ${
                step.active ? 'bg-accent' : 'bg-border'
              }`}
            />
            {i < STEPS.length - 1 && <div className="w-px h-7 bg-border-light" />}
          </div>
          <span
            className={`text-sm font-medium -mt-0.5 ${
              step.active ? 'text-foreground' : 'text-muted'
            }`}
          >
            {step.label}
          </span>
        </div>
      ))}
    </div>
  )
}
