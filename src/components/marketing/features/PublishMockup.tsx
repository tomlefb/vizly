import { BrowserFrame } from './BrowserFrame'

export function PublishMockup() {
  return (
    <BrowserFrame url="vizly.fr/dashboard">
      <div className="p-5 sm:p-6">
        {/* En-tête dashboard */}
        <div className="text-xs font-semibold text-foreground font-[family-name:var(--font-satoshi)] mb-3">
          Mes portfolios
        </div>

        {/* Carte projet — En ligne */}
        <div className="rounded-[var(--radius-md)] border border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-semibold text-accent">
                TL
              </div>
              <div>
                <div className="text-[11px] font-semibold text-foreground">Portfolio de Thomas L.</div>
                <div className="text-[9px] text-muted-foreground">Mis à jour il y a 2 heures</div>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-semibold text-success">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              En ligne
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">URL :</span>
              <span className="rounded-[var(--radius-sm)] bg-surface-warm border border-border-light px-2 py-0.5 text-[10px] text-foreground font-mono">
                thomas-l.vizly.fr
              </span>
            </div>
            <span className="rounded-[var(--radius-sm)] bg-accent px-2.5 py-1 text-[9px] font-semibold text-white">
              Modifier
            </span>
          </div>
        </div>

        {/* Carte projet — Brouillon */}
        <div className="rounded-[var(--radius-md)] border border-border p-4 mt-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-surface-warm border border-border-light flex items-center justify-center text-[9px] font-semibold text-muted">
                NE
              </div>
              <div>
                <div className="text-[11px] font-semibold text-foreground">Notes &amp; exp&eacute;rimentations</div>
                <div className="text-[9px] text-muted-foreground">Modifi&eacute; hier</div>
              </div>
            </div>
            <span className="inline-flex items-center rounded-full bg-surface-warm px-2 py-0.5 text-[9px] font-semibold text-muted">
              Brouillon
            </span>
          </div>
        </div>

        {/* Placeholder création */}
        <div className="rounded-[var(--radius-md)] border border-dashed border-border p-3 mt-2.5 flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">+ Cr&eacute;er un nouveau portfolio</span>
        </div>
      </div>
    </BrowserFrame>
  )
}
