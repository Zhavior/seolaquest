import React from 'react'
import Link from 'next/link'
import { BlogCodeBlock } from '@/features/blog/components/BlogCodeBlock'
import { stripEmoji } from '@/features/handbook/text'

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
        <Link key={match.index} href={href}>
          {linkLabel}
        </Link>
      )
    } else if (boldText !== undefined) {
      parts.push(
        <strong key={match.index}>{boldText}</strong>
      )
    } else if (codeText !== undefined) {
      parts.push(
        <code key={match.index} className="hb-inline-code">
          {codeText}
        </code>
      )
    } else {
      parts.push(
        <em key={match.index}>{italicText}</em>
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
      <div key={index} className="hb-article-flow">
        {paragraphs.map((para, pIdx) => {
          const trimmed = para.trim()
          if (!trimmed) return null

          // Horizontal rule (--- or ***)
          if (/^[-*_]{3,}$/.test(trimmed)) {
            return (
              <hr key={pIdx} className="hb-rule" />
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
              <div key={pIdx} className="hb-table-wrap" tabIndex={0} role="region" aria-label="Table, scrolls sideways">
                <table className="hb-ledger">
                  <thead>
                    <tr>
                      {headerCells.map((cell, cIdx) => (
                        <th
                          key={cIdx}
                          scope="col"
                          style={{ textAlign: alignments[cIdx] || 'left' }}
                        >
                          {renderInlineText(cell)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {bodyRows.map((row, rIdx) => (
                      <tr key={rIdx}>
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
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
              // The page header owns the H1; a body-level `#` is a section head.
              <h2 id={id} key={pIdx} className="hb-h2 hb-article-h2">
                {renderInlineText(stripEmoji(text))}
              </h2>
            )
          }

          // H2 Heading
          if (trimmed.startsWith('## ')) {
            const text = trimmed.slice(3).trim()
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            return (
              <h2 id={id} key={pIdx} className="hb-h2 hb-article-h2">
                {renderInlineText(stripEmoji(text))}
              </h2>
            )
          }

          // H3 Heading
          if (trimmed.startsWith('### ')) {
            const text = trimmed.slice(4).trim()
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            return (
              <h3 id={id} key={pIdx} className="hb-h3 hb-article-h3">
                {renderInlineText(stripEmoji(text))}
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
              <figure key={pIdx} className="hb-article-figure">
                {/* eslint-disable-next-line @next/next/no-img-element -- post
                    images are local, pre-sized screenshots; next/image adds a
                    layout wrapper that fights the offset-slab border here. */}
                <img
                  src={src}
                  alt={alt}
                  loading="lazy"
                  decoding="async"
                />
                {caption && <figcaption className="hb-mono hb-soft">{caption}</figcaption>}
              </figure>
            )
          }

          // Callout Blockquote (supports multi-line > prefixed blocks)
          if (trimmed.startsWith('>')) {
            const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '').trim())
            const quoteText = quoteLines.join(' ')
            return (
              <blockquote key={pIdx} className="hb-callout">
                {renderInlineText(quoteText)}
              </blockquote>
            )
          }

          // Unordered list
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const items = trimmed.split(/\n/).map((line) => line.replace(/^[-*]\s*/, '').trim())
            return (
              <ul key={pIdx} className="hb-article-list">
                {items.map((item, iIdx) => (
                  <li key={iIdx}>{renderInlineText(item)}</li>
                ))}
              </ul>
            )
          }

          // Ordered list
          if (/^\d+\.\s/.test(trimmed)) {
            const items = trimmed.split(/\n/).map((line) => line.replace(/^\d+\.\s*/, '').trim())
            return (
              <ol key={pIdx} className="hb-article-list hb-article-list--ordered">
                {items.map((item, iIdx) => (
                  <li key={iIdx}>{renderInlineText(item)}</li>
                ))}
              </ol>
            )
          }

          // Standard Paragraph text with inline formatting
          return (
            <p key={pIdx}>{renderInlineText(trimmed)}</p>
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
