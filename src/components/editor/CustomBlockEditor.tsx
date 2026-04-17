'use client'

import { useState, useCallback } from 'react'
import { Plus, Pencil, Trash2, X, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { VzBtn } from '@/components/ui/vizly'
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

  const inputBase =
    'w-full rounded-[var(--radius-md)] border border-border-light bg-surface px-4 py-2.5 text-[15px] text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none'

  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground font-[family-name:var(--font-satoshi)]">
          Blocs de texte
        </h3>
        <p className="text-sm text-muted mt-1">
          Ajoute des sections de texte personnalisées
        </p>
      </div>

      {/* Existing blocks — with content preview */}
      {blocks.length > 0 && (
        <div className="space-y-2">
          {blocks.map((block, index) => {
            const preview = stripHtml(block.content)
            return (
              <div
                key={block.id}
                className="flex items-start gap-3 bg-surface rounded-[var(--radius-md)] border border-border-light px-4 py-3 group hover:border-border transition-colors"
              >
                <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{block.title || 'Sans titre'}</p>
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
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-warm transition-colors"
                    aria-label="Modifier"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-destructive hover:bg-destructive/5 transition-colors"
                    aria-label="Supprimer"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add button — dashed neutral */}
      <button
        type="button"
        onClick={openNew}
        className="flex items-center justify-center gap-1.5 w-full border border-dashed border-border-light rounded-[var(--radius-md)] py-2.5 text-sm font-medium text-muted transition-colors duration-150 hover:border-muted-foreground hover:text-foreground"
      >
        <Plus className="h-4 w-4" strokeWidth={1.5} />
        Ajouter un bloc texte
      </button>

      {/* Edit modal */}
      <AnimatePresence>
        {isEditing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-foreground/30 p-4 pt-[8vh]"
            onMouseDown={(e) => { if (e.target === e.currentTarget) setIsEditing(false) }}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="w-full max-w-2xl rounded-[var(--radius-xl)] border border-border-light bg-surface overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-border-light px-6 py-4">
                <h3 className="text-lg font-semibold font-[family-name:var(--font-satoshi)] text-foreground">
                  {editingIndex !== null ? 'Modifier le bloc' : 'Nouveau bloc texte'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted hover:text-foreground hover:bg-surface-warm transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 max-h-[65vh] overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Titre <span className="text-destructive">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingBlock.title}
                    onChange={(e) => setEditingBlock({ ...editingBlock, title: e.target.value })}
                    placeholder="Ex : À propos de moi"
                    maxLength={200}
                    className={inputBase}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Sous-titre
                  </label>
                  <input
                    type="text"
                    value={editingBlock.subtitle}
                    onChange={(e) => setEditingBlock({ ...editingBlock, subtitle: e.target.value })}
                    placeholder="Ex : Mon parcours et mes passions"
                    maxLength={200}
                    className={inputBase}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-foreground">
                    Contenu
                  </label>
                  <RichTextEditor
                    value={editingBlock.content}
                    onChange={(html) => setEditingBlock({ ...editingBlock, content: html })}
                    placeholder="Écris ton contenu ici… Utilise la barre d'outils pour le formatage."
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-border-light px-6 py-4">
                <VzBtn variant="ghost" size="sm" onClick={() => setIsEditing(false)}>Annuler</VzBtn>
                <VzBtn
                  variant="primary"
                  onClick={handleSave}
                  disabled={!editingBlock.title.trim()}
                >
                  {editingIndex !== null ? 'Enregistrer' : 'Ajouter'}
                </VzBtn>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
