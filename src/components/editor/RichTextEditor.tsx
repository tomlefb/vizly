'use client'

import { useRef, useCallback, useEffect } from 'react'
import { Bold, Italic, Heading1, Heading2, List, AlignLeft, AlignCenter, Type } from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder = 'Ecris ton texte ici...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const isInitializedRef = useRef(false)

  // Set initial content only once
  useEffect(() => {
    if (editorRef.current && !isInitializedRef.current) {
      editorRef.current.innerHTML = value
      isInitializedRef.current = true
    }
  }, [value])

  const execCommand = useCallback((command: string, val?: string) => {
    document.execCommand(command, false, val)
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const tools = [
    { icon: Bold, command: 'bold', label: 'Gras' },
    { icon: Italic, command: 'italic', label: 'Italique' },
    { icon: Heading1, command: 'formatBlock', value: 'h2', label: 'Titre' },
    { icon: Heading2, command: 'formatBlock', value: 'h3', label: 'Sous-titre' },
    { icon: List, command: 'insertUnorderedList', label: 'Liste' },
    { icon: AlignLeft, command: 'justifyLeft', label: 'Aligner a gauche' },
    { icon: AlignCenter, command: 'justifyCenter', label: 'Centrer' },
  ]

  const sizes = [
    { value: '1', label: 'P', title: 'Petit' },
    { value: '3', label: 'M', title: 'Moyen' },
    { value: '5', label: 'G', title: 'Grand' },
  ]

  return (
    <div className="rounded-[var(--radius-md)] border border-border bg-surface overflow-hidden focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border bg-surface-warm/50 px-2 py-1.5 flex-wrap">
        {tools.map((tool) => (
          <button
            key={tool.command + (tool.value ?? '')}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand(tool.command, tool.value)
            }}
            className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-surface-warm hover:text-foreground"
            title={tool.label}
            aria-label={tool.label}
          >
            <tool.icon className="h-3.5 w-3.5" />
          </button>
        ))}

        {/* Separator */}
        <span className="mx-1 h-4 w-px bg-border" />

        {/* Font size buttons */}
        <div className="flex items-center gap-0.5">
          <Type className="h-3 w-3 text-muted-foreground/50 mr-0.5" />
          {sizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCommand('fontSize', size.value)
              }}
              className="flex h-7 items-center justify-center rounded-[var(--radius-sm)] px-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-surface-warm hover:text-foreground"
              title={size.title}
              aria-label={size.title}
            >
              {size.label}
            </button>
          ))}
        </div>
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        className={cn(
          'min-h-[120px] px-4 py-3 text-sm text-foreground leading-relaxed outline-none',
          '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1',
          '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1',
          '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-2',
          '[&_p]:my-1',
          'empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50'
        )}
        data-placeholder={placeholder}
      />
    </div>
  )
}
