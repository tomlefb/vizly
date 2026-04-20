'use client'

import { useRef, useCallback, useEffect } from 'react'
import { Bold, Italic, Heading1, Heading2, List, AlignLeft, AlignCenter, Type } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const t = useTranslations('editor.richText')
  const effectivePlaceholder = placeholder ?? t('defaultPlaceholder')
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
    { icon: Bold, command: 'bold', label: t('bold') },
    { icon: Italic, command: 'italic', label: t('italic') },
    { icon: Heading1, command: 'formatBlock', value: 'h2', label: t('heading') },
    { icon: Heading2, command: 'formatBlock', value: 'h3', label: t('subheading') },
    { icon: List, command: 'insertUnorderedList', label: t('list') },
    { icon: AlignLeft, command: 'justifyLeft', label: t('alignLeft') },
    { icon: AlignCenter, command: 'justifyCenter', label: t('alignCenter') },
  ]

  const sizes = [
    { value: '1', label: 'P', title: t('sizeSmall') },
    { value: '3', label: 'M', title: t('sizeMedium') },
    { value: '5', label: 'G', title: t('sizeLarge') },
  ]

  return (
    <div className="rounded-[var(--radius-md)] border border-border-light bg-surface overflow-hidden focus-within:border-foreground transition-colors">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border-light bg-surface-warm px-2 py-1.5 flex-wrap">
        {tools.map((tool) => (
          <button
            key={tool.command + (tool.value ?? '')}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault()
              execCommand(tool.command, tool.value)
            }}
            className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
            title={tool.label}
            aria-label={tool.label}
          >
            <tool.icon className="h-4 w-4" strokeWidth={1.5} />
          </button>
        ))}

        {/* Separator */}
        <span className="mx-1 h-4 w-px bg-border-light" />

        {/* Font size buttons */}
        <div className="flex items-center gap-0.5">
          <Type className="h-3 w-3 text-muted-foreground/50 mr-0.5" strokeWidth={1.5} />
          {sizes.map((size) => (
            <button
              key={size.value}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                execCommand('fontSize', size.value)
              }}
              className="flex h-8 items-center justify-center rounded-[var(--radius-sm)] px-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-surface hover:text-foreground"
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
        data-placeholder={effectivePlaceholder}
      />
    </div>
  )
}
