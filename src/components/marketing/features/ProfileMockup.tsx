import { BrowserFrame } from './BrowserFrame'

const SKILLS = ['Node.js', 'PostgreSQL', 'Docker', 'TypeScript', 'Redis']

export function ProfileMockup() {
  return (
    <BrowserFrame url="vizly.fr/editeur/profil">
      <div className="p-5 sm:p-6 space-y-3.5">
        {/* Photo + Nom */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center text-xs font-semibold text-accent shrink-0">
            TL
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] text-muted-foreground mb-0.5">Nom complet</div>
            <div className="h-7 rounded-[var(--radius-sm)] border border-border px-2.5 flex items-center text-[11px] text-foreground">
              Thomas Lefèvre
            </div>
          </div>
        </div>

        {/* Bio */}
        <div>
          <div className="text-[10px] text-muted-foreground mb-0.5">Bio</div>
          <div className="rounded-[var(--radius-sm)] border border-border px-2.5 py-2 text-[10px] text-muted leading-relaxed">
            Développeur backend passionné par les architectures distribuées et les APIs performantes.
            5 ans d&apos;expérience en Node.js et PostgreSQL.
          </div>
          <div className="text-right text-[9px] text-muted-foreground mt-0.5">142/500</div>
        </div>

        {/* Email */}
        <div>
          <div className="text-[10px] text-muted-foreground mb-0.5">Email</div>
          <div className="h-7 rounded-[var(--radius-sm)] border border-border px-2.5 flex items-center text-[10px] text-muted">
            thomas.lefevre@email.com
          </div>
        </div>

        {/* Réseaux sociaux */}
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Réseaux sociaux</div>
          <div className="space-y-1.5">
            <div className="h-7 rounded-[var(--radius-sm)] border border-border px-2.5 flex items-center text-[10px] text-muted">
              linkedin.com/in/thomas-l
            </div>
            <div className="h-7 rounded-[var(--radius-sm)] border border-border px-2.5 flex items-center text-[10px] text-muted">
              github.com/thomas-lefevre
            </div>
          </div>
        </div>

        {/* Compétences */}
        <div>
          <div className="text-[10px] text-muted-foreground mb-1">Compétences</div>
          <div className="flex flex-wrap gap-1">
            {SKILLS.map(tag => (
              <span
                key={tag}
                className="rounded-[4px] bg-surface-warm border border-border-light px-1.5 py-0.5 text-[9px] text-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </BrowserFrame>
  )
}
