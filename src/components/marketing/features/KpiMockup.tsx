import { Star } from 'lucide-react'
import { BrowserFrame } from './BrowserFrame'

export function KpiMockup() {
  return (
    <BrowserFrame url="vizly.fr/editeur/contenu">
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-2 gap-3">
          {/* Compteur */}
          <div className="rounded-[var(--radius-md)] border border-border p-4 text-center">
            <div className="text-2xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
              127
            </div>
            <div className="text-[10px] text-muted mt-0.5">projets livrés</div>
          </div>

          {/* Anneau de progression */}
          <div className="rounded-[var(--radius-md)] border border-border p-4 flex flex-col items-center">
            <svg viewBox="0 0 36 36" className="w-12 h-12">
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="currentColor" className="text-border"
                strokeWidth="2.5"
              />
              <circle
                cx="18" cy="18" r="14" fill="none"
                stroke="currentColor" className="text-accent"
                strokeWidth="2.5"
                strokeDasharray="87.96 100"
                strokeLinecap="round"
                transform="rotate(-90 18 18)"
              />
              <text
                x="18" y="19.5" textAnchor="middle"
                className="fill-foreground text-[8px] font-semibold"
              >
                87%
              </text>
            </svg>
            <div className="text-[10px] text-muted mt-1">Satisfaction client</div>
          </div>

          {/* Étoiles */}
          <div className="rounded-[var(--radius-md)] border border-border p-4 text-center">
            <div className="flex justify-center gap-0.5 mb-1">
              {[1, 2, 3, 4].map(i => (
                <Star key={i} className="w-3.5 h-3.5 fill-accent text-accent" />
              ))}
              <Star className="w-3.5 h-3.5 fill-border text-border" />
            </div>
            <div className="text-lg font-bold text-foreground font-[family-name:var(--font-satoshi)]">
              4.8<span className="text-xs font-normal text-muted">/5</span>
            </div>
            <div className="text-[10px] text-muted mt-0.5">Note moyenne</div>
          </div>

          {/* Timeline */}
          <div className="rounded-[var(--radius-md)] border border-border p-4">
            <div className="flex items-center w-full mb-2">
              <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <div className="flex-1 h-px bg-accent" />
              <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <div className="flex-1 h-px bg-accent" />
              <div className="w-2 h-2 rounded-full bg-accent shrink-0" />
              <div className="flex-1 h-px bg-border" />
              <div className="w-2 h-2 rounded-full bg-border shrink-0" />
            </div>
            <div className="flex justify-between text-[8px] text-muted-foreground">
              <span>2021</span>
              <span>2022</span>
              <span>2024</span>
              <span>2025</span>
            </div>
            <div className="text-[10px] text-muted mt-1.5 text-center">Expérience</div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}
