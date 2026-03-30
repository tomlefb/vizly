import { Eye, ArrowLeft, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PortfolioFormData, ProjectFormData } from '@/lib/validations'

interface StepPreviewProps {
  data: PortfolioFormData
  projects: ProjectFormData[]
  onBack: () => void
  onContinue: () => void
  className?: string
}

export function StepPreview({
  data,
  projects,
  onBack,
  onContinue,
  className,
}: StepPreviewProps) {
  return (
    <div className={cn('space-y-6', className)} data-testid="step-preview">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-[var(--radius-lg)] bg-accent/10 mx-auto">
          <Eye className="h-6 w-6 text-accent" />
        </div>
        <h2 className="text-xl font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Voici a quoi ressemblera ton portfolio
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Verifie que tout est comme tu veux avant de passer a la publication.
          Tu peux toujours revenir modifier.
        </p>
      </div>

      {/* Preview placeholder — full template rendering will be connected later */}
      <div className="rounded-[var(--radius-xl)] border border-border overflow-hidden bg-surface shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-surface-warm px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="rounded-[var(--radius-sm)] bg-surface border border-border-light px-4 py-1 text-xs text-muted-foreground font-mono">
              pseudo.vizly.fr
            </div>
          </div>
        </div>

        {/* Portfolio preview content */}
        <div
          className="min-h-[400px] p-8"
          style={{
            backgroundColor: data.secondary_color === '#1A1A1A' ? '#FAFAF8' : '#FAFAF8',
            fontFamily: `"${data.font}", system-ui, sans-serif`,
          }}
        >
          {/* Header area */}
          <div className="flex items-start gap-6 mb-8">
            {data.photo_url ? (
              <div className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] overflow-hidden border border-border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={data.photo_url}
                  alt="Photo de profil"
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-[var(--radius-md)] bg-surface-warm border border-border-light flex items-center justify-center">
                <span className="text-lg text-muted-foreground/30 font-semibold">?</span>
              </div>
            )}
            <div>
              <h3
                className="text-xl font-bold"
                style={{ color: data.primary_color }}
              >
                {data.title || 'Ton nom'}
              </h3>
              {data.bio && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-3">
                  {data.bio}
                </p>
              )}
            </div>
          </div>

          {/* Projects */}
          {projects.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              {projects.map((project, i) => (
                <div
                  key={i}
                  className="rounded-[var(--radius-md)] border border-border bg-surface p-4"
                >
                  {project.images.length > 0 && (
                    <div className="h-24 rounded-[var(--radius-sm)] bg-surface-warm mb-3 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={project.images[0]}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <p className="text-sm font-semibold text-foreground">
                    {project.title}
                  </p>
                  {project.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {project.tags.slice(0, 4).map((tag) => (
                        <span
                          key={tag}
                          className="inline-block rounded-[3px] px-1.5 py-0.5 text-[10px] font-medium"
                          style={{
                            backgroundColor: `${data.primary_color}15`,
                            color: data.primary_color,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                Tes projets apparaitront ici
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5 text-sm font-medium text-foreground transition-all duration-200 hover:bg-surface-warm active:scale-[0.98]"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour a l&apos;edition
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-accent-hover active:scale-[0.98] shadow-[0_2px_8px_rgba(232,85,61,0.2)]"
        >
          Continuer vers la publication
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
