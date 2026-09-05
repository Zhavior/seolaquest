import React from 'react'
import Link from 'next/link'
import { sfx } from '@/lib/sfx'
import { BlogCodeBlock } from '@/features/blog/components/BlogCodeBlock'

/**
 * Helper to parse inline markdown with sound triggers:
 * links [text](href), bold **text**, italic *text*, and inline `code`
 */
const INLINE_REGEX = /\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|`([^`]+)`|\*([^*\n]+)\*/g

function renderInlineText(text: string): React.ReactNode {
  const parts: (string | React.ReactNode)[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  INLINE_REGEX.lastIndex = 0

  while ((match = INLINE_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }

    const [, linkLabel, href, boldText, codeText, italicText] = match

    if (linkLabel !== undefined) {
      parts.push(
        <Link
          key={match.index}
          href={href}
          onMouseEnter={() => sfx.playHoverBlip()}
          onClick={() => sfx.playCoinDrop()}
          className="font-semibold text-link underline decoration-2 underline-offset-2 hover:bg-accent hover:text-on-accent px-1 py-0.5 border border-outline  transition-colors"
        >
          {linkLabel}
        </Link>
      )
    } else if (boldText !== undefined) {
      parts.push(
        <strong key={match.index} className="font-semibold text-ink">
          {boldText}
        </strong>
      )
    } else if (codeText !== undefined) {
      parts.push(
        <code
          key={match.index}
          className="rounded-xl border border-outline bg-accent/25 px-1 py-0.5 font-mono text-[0.85em] font-medium text-ink"
        >
          {codeText}
        </code>
      )
    } else {
      parts.push(
        <em key={match.index} className="italic">
          {italicText}
        </em>
      )
    }

    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex))
  }

  return parts.length > 0 ? parts : text
}

/**
 * Render Markdown content cleanly with custom Neo-Brutalist blocks
 */
function renderMarkdownContent(content: string) {
  // Split content by code blocks to isolate pre/code snippets
  const parts = content.split(/(```[\s\S]*?```)/g)

  return parts.map((part, index) => {
    if (part.startsWith('```')) {
      const firstLineEnd = part.indexOf('\n')
      const lang = part.slice(3, firstLineEnd).trim() || 'code'
      const code = part.slice(firstLineEnd + 1, -3)
      return <BlogCodeBlock key={index} language={lang} code={code} />
    }

    // Process non-code content line by line or paragraph by paragraph
    const paragraphs = part.split(/\n\n+/)
    return (
      <div key={index} className="space-y-4">
        {paragraphs.map((para, pIdx) => {
          const trimmed = para.trim()
          if (!trimmed) return null

          // Horizontal rule (--- or ***)
          if (/^[-*_]{3,}$/.test(trimmed)) {
            return (
              <hr key={pIdx} className="my-8 border-t border-outline" />
            )
          }

          // Markdown Table
          const tableLines = trimmed.split('\n').filter(Boolean)
          if (
            tableLines.length >= 2 &&
            tableLines[0].includes('|') &&
            /^[\s|:-]+$/.test(tableLines[1])
          ) {
            const parseRow = (row: string) =>
              row
                .split('|')
                .map((cell) => cell.trim())
                .filter((cell) => cell !== '')

            const headerCells = parseRow(tableLines[0])

            // Parse alignment from separator row
            const alignmentCells = parseRow(tableLines[1])
            const alignments = alignmentCells.map((sep) => {
              if (sep.startsWith(':') && sep.endsWith(':')) return 'center' as const
              if (sep.endsWith(':')) return 'right' as const
              return 'left' as const
            })

            const bodyRows = tableLines.slice(2).map(parseRow)

            return (
              <div key={pIdx} className="my-6 overflow-x-auto">
                <table className="w-full border border-outline text-sm">
                  <thead>
                    <tr className="bg-forest text-accent">
                      {headerCells.map((cell, cIdx) => (
                        <th
                          key={cIdx}
                          className="border border-outline px-4 py-2.5 font-semibold text-xs text-left"
                          style={{ textAlign: alignments[cIdx] || 'left' }}
                        >
                          {renderInlineText(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rIdx) => (
                      <tr
                        key={rIdx}
                        className={rIdx % 2 === 0 ? 'bg-card' : 'bg-canvas'}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border border-outline px-4 py-2 font-medium text-ink"
                            style={{ textAlign: alignments[cIdx] || 'left' }}
                          >
                            {renderInlineText(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }

          // H1 Heading
          if (trimmed.startsWith('# ')) {
            const text = trimmed.slice(2).trim()
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            return (
              <h1 id={id} key={pIdx} className="font-display text-2xl sm:text-3xl md:text-4xl font-medium text-ink pt-6 pb-2 border-b border-outline">
                {renderInlineText(text)}
              </h1>
            )
          }

          // H2 Heading
          if (trimmed.startsWith('## ')) {
            const text = trimmed.slice(3).trim()
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            return (
              <h2 id={id} key={pIdx} className="font-display text-xl sm:text-2xl font-medium text-ink pt-5 pb-1 border-b border-outline flex items-center gap-2">
                <span className="h-3 w-3 bg-accent border border-outline inline-block"></span>
                {renderInlineText(text)}
              </h2>
            )
          }

          // H3 Heading
          if (trimmed.startsWith('### ')) {
            const text = trimmed.slice(4).trim()
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            return (
              <h3 id={id} key={pIdx} className="font-display text-lg font-medium text-ink pt-3">
                {renderInlineText(text)}
              </h3>
            )
          }

          // Figure: ![alt](src) on its own line, with the following italic
          // line taken as the caption. Handled before the link parser, which
          // would otherwise match the bracket pair and emit a stray "!".
          const figure = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*(?:\n\*([^*]+)\*)?$/.exec(trimmed)
          if (figure) {
            const [, alt, src, caption] = figure
            return (
              <figure key={pIdx} className="my-6 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- post
                    images are local, pre-sized screenshots; next/image adds a
                    layout wrapper that fights the offset-slab border here. */}
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                  className="w-full border border-outline"
                />
                {caption && (
                  <figcaption className="text-xs font-medium tracking-wide text-ink-muted">
                    {caption}
                  </figcaption>
                )}
              </figure>
            )
          }

          // Callout Blockquote (supports multi-line > prefixed blocks)
          if (trimmed.startsWith('>')) {
            const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '').trim())
            const quoteText = quoteLines.join(' ')
            return (
              // `bg-accent/20` is a different class from `bg-accent`, so the
              // ink-inversion rule in globals.css does not apply to it and the
              // theme's own ink is the correct colour here.
              <blockquote key={pIdx} className="my-5 border-l border-link bg-accent/20 border border-outline p-4 font-medium text-ink">
                {renderInlineText(quoteText)}
              </blockquote>
            )
          }

          // Unordered list
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split(/\n/).map((line) => line.replace(/^[-*]\s*/, '').trim())
            return (
              <ul key={pIdx} className="my-3 space-y-2 pl-4">
                {items.map((item, iIdx) => (
                  <li key={iIdx} className="flex items-start gap-2 font-medium text-ink text-sm md:text-base">
                    <span className="mt-1 flex h-2 w-2 shrink-0 bg-forest rotate-45" />
                    <span>{renderInlineText(item)}</span>
                  </li>
                ))}
              </ul>
            )
          }

          // Ordered list
          if (/^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split(/\n/).map((line) => line.replace(/^\d+\.\s*/, '').trim())
            return (
              <ol key={pIdx} className="my-3 space-y-2 pl-4 list-decimal font-medium text-ink text-sm md:text-base">
                {items.map((item, iIdx) => (
                  <li key={iIdx} className="pl-1">
                    {renderInlineText(item)}
                  </li>
                ))}
              </ol>
            )
          }

          // Standard Paragraph text with inline formatting
          return (
            <p key={pIdx} className="text-sm md:text-base font-medium text-ink leading-relaxed">
              {renderInlineText(trimmed)}
            </p>
          )
        })}
      </div>
    )
  })
}

interface BlogMarkdownRendererProps {
  content: string
}

export function BlogMarkdownRenderer({ content }: BlogMarkdownRendererProps) {
  return <>{renderMarkdownContent(content)}</>
}
