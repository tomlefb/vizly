'use client'

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { RichTextEditor } from './RichTextEditor'
import { generateBlockId, type CustomBlock } from '@/types/custom-blocks'

interface CustomBlockEditorProps {
  blocks: CustomBlock[]
  onChange: (blocks: CustomBlock[]) => void
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim()
}

export function CustomBlockEditor({ blocks, onChange }: CustomBlockEditorProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingBlock, setEditingBlock] = useState<CustomBlock>({
    id: '', title: '', subtitle: '', content: '', order: 0,
  })

  const openNew = useCallback(() => {
    setEditingIndex(null)
    setEditingBlock({
      id: generateBlockId(),
      title: '',
      subtitle: '',
      content: '',
      order: blocks.length,
    })
    setIsEditing(true)
  }, [blocks.length])

  const openEdit = useCallback((index: number) => {
    const block = blocks[index]
    if (block) {
      setEditingIndex(index)
      setEditingBlock({ ...block })
      setIsEditing(true)
    }
  }, [blocks])

  const handleSave = useCallback(() => {
    if (!editingBlock.title.trim()) return
    if (editingIndex !== null) {
      const updated = [...blocks]
      updated[editingIndex] = editingBlock
      onChange(updated)
    } else {
      onChange([...blocks, editingBlock])
    }
    setIsEditing(false)
  }, [editingBlock, editingIndex, blocks, onChange])

  const handleDelete = useCallback((index: number) => {
    onChange(blocks.filter((_, i) => i !== index))
  }, [blocks, onChange])

  return (
    <section className="border border-border rounded-[var(--radius-lg)] p-5 space-y-4">
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] bg-accent/10">
          <FileText className="h-3.5 w-3.5 text-accent" />
        </div>
        <div>
          <h2 className="text-base font-medium text-foreground font-[family-name:var(--font-satoshi)]">
            Blocs de texte
          </h2>
          <p className="text-[11px] text-muted-foreground">
            Ajoute des sections de texte personnalisees
          </p>
        </div>
      </div>

      {/* Existing blocks — with content preview */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const preview = stripHtml(block.content)
            return (
              <div
                key={block.id}
                className="flex items-start gap-3 bg-white rounded-[var(--radius-md)] border border-border px-4 py-3 group"
              >
                <FileText className="h-4 w-4 text-muted-foreground/40 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-foreground truncate">{block.title || 'Sans titre'}</p>
                  {block.subtitle && (
                    <p className="text-xs text-muted truncate">{block.subtitle}</p>
                  )}
                  {preview && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{preview}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => openEdit(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors"
                    aria-label="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add button — dashed terracotta */}
      <button
        type="button"
        onClick={openNew}
        className="flex items-center justify-center gap-1.5 w-full border border-dashed border-accent/30 rounded-[var(--radius-md)] py-2.5 text-[12px] font-medium text-accent transition-all duration-200 hover:border-accent hover:bg-accent-light/50"
      >
        <Plus className="h-4 w-4" />
        Ajouter un bloc texte
      </button>

      {/* Edit modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 backdrop-blur-sm p-4 pt-[8vh]"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditing(false) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-2xl rounded-[20px] border border-border bg-background shadow-[0_16px_48px_rgba(0,0,0,0.12)] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border px-6 py-4">
                <h3 className="text-[20px] font-medium font-[family-name:var(--font-satoshi)]">
                  {editingIndex !== null ? 'Modifier le bloc' : 'Nouveau bloc texte'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground hover:text-foreground hover:bg-surface-warm transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-muted">
                    Titre <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingBlock.title}
                    onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                    placeholder="Ex: A propos de moi"
                    maxLength={200}
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-muted">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    value={editingBlock.subtitle}
                    onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })}
                    placeholder="Ex: Mon parcours et mes passions"
                    maxLength={200}
                    className="w-full rounded-[var(--radius-md)] border border-border bg-surface px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/15"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[13px] font-medium text-muted">
                    Contenu
                  </label>
                  <RichTextEditor
                    value={editingBlock.content}
                    onChange={(html) => setEditingBlock({ ...editingBlock, content: html })}
                    placeholder="Ecris ton contenu ici... Utilise la barre d'outils pour le formatage."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="rounded-[var(--radius-md)] px-4 py-2 text-[13px] font-medium text-muted hover:text-foreground hover:bg-surface-warm transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={!editingBlock.title.trim()}
                  className={cn(
                    'rounded-[var(--radius-md)] px-5 py-2 text-[13px] font-semibold transition-all',
                    editingBlock.title.trim()
                      ? 'bg-accent text-white hover:bg-accent-hover active:scale-[0.98]'
                      : 'bg-accent/50 text-white/60 cursor-not-allowed'
                  )}
                >
                  {editingIndex !== null ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
