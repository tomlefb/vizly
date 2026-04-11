import { Star, TrendingUp } from 'lucide-react'
import { BrowserFrame } from './BrowserFrame'

export function KpiMockup() {
  return (
    <BrowserFrame url="vizly.fr/editeur/contenu">
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-3 gap-2.5">
          {/* Compteur */}
          <div className="rounded-[var(--radius-md)] border border-border p-3 text-center">
            <div className="text-xl font-bold text-foreground font-[family-name:var(--font-satoshi)]">
              127
            </div>
            <div className="text-[10px] text-muted mt-0.5">projets livrés</div>
          </div>

          {/* Anneau de progression */}
          <div className="rounded-[var(--radius-md)] border border-border p-3 flex flex-col items-center">
            <svg viewBox="0 0 36 36" className="w-10 h-10">
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
            <div className="text-[10px] text-muted mt-1">Satisfaction</div>
          </div>

          {/* Étoiles */}
          <div className="rounded-[var(--radius-md)] border border-border p-3 text-center">
            <div className="flex justify-center gap-0.5 mb-1">
              {[1, 2, 3, 4].map(i => (
                <Star key={i} className="w-3 h-3 fill-accent text-accent" />
              ))}
              <Star className="w-3 h-3 fill-border text-border" />
            </div>
            <div className="text-base font-bold text-foreground font-[family-name:var(--font-satoshi)]">
              4.8<span className="text-[10px] font-normal text-muted">/5</span>
            </div>
            <div className="text-[10px] text-muted mt-0.5">Note moyenne</div>
          </div>

          {/* Barre de progression */}
          <div className="rounded-[var(--radius-md)] border border-border p-3">
            <div className="text-[10px] text-muted mb-1.5">Profil complété</div>
            <div className="h-1.5 bg-border rounded-full overflow-hidden">
              <div className="h-full bg-accent rounded-full" style={{ width: '92%' }} />
            </div>
            <div className="text-base font-bold text-foreground font-[family-name:var(--font-satoshi)] mt-1">
              92<span className="text-[10px] font-normal text-muted">%</span>
            </div>
          </div>

          {/* Tendance */}
          <div className="rounded-[var(--radius-md)] border border-border p-3 text-center">
            <div className="flex items-center justify-center gap-0.5 text-success mb-0.5">
              <TrendingUp className="w-3 h-3" />
              <span className="text-[10px] font-semibold">+34%</span>
            </div>
            <div className="text-base font-bold text-foreground font-[family-name:var(--font-satoshi)]">
              1,2k
            </div>
            <div className="text-[10px] text-muted mt-0.5">Vues portfolio</div>
          </div>

          {/* Timeline */}
          <div className="rounded-[var(--radius-md)] border border-border p-3">
            <div className="flex items-center w-full mb-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <div className="flex-1 h-px bg-accent" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <div className="flex-1 h-px bg-accent" />
              <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
              <div className="flex-1 h-px bg-border" />
              <div className="w-1.5 h-1.5 rounded-full bg-border shrink-0" />
            </div>
            <div className="flex justify-between text-[7px] text-muted-foreground">
              <span>2021</span>
              <span>2022</span>
              <span>2024</span>
              <span>2025</span>
            </div>
            <div className="text-[10px] text-muted mt-1 text-center">Expérience</div>
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}
