import React from 'react'
import Link from 'next/link'
import { sfx } from '@/lib/sfx'
import { BlogCodeBlock } from '@/features/blog/components/BlogCodeBlock'

/**
 * Helper to parse inline markdown links [text](href) with sound triggers
 */
function renderInlineText(text: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g
  const parts: (string | React.ReactNode)[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index))
    }
    const label = match[1]
    const href = match[2]
    parts.push(
      <Link
        key={match.index}
        href={href}
        onMouseEnter={() => sfx.playHoverBlip()}
        onClick={() => sfx.playCoinDrop()}
        className="font-black text-[#8A2BE2] underline decoration-2 underline-offset-2 hover:bg-[#FFE600] px-1 py-0.5 border border-black shadow-[1px_1px_0_0_#000] transition-colors"
      >
        {label}
      </Link>
    )
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
              <hr key={pIdx} className="my-8 border-t-4 border-black" />
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
                <table className="w-full border-4 border-black shadow-[4px_4px_0_0_#000] text-sm">
                  <thead>
                    <tr className="bg-black text-[#FFE600]">
                      {headerCells.map((cell, cIdx) => (
                        <th
                          key={cIdx}
                          className="border-2 border-black px-4 py-2.5 font-black uppercase text-xs text-left"
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
                        className={rIdx % 2 === 0 ? 'bg-white' : 'bg-[#F4F0EA]'}
                      >
                        {row.map((cell, cIdx) => (
                          <td
                            key={cIdx}
                            className="border-2 border-black px-4 py-2 font-bold text-zinc-800"
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
              <h1 id={id} key={pIdx} className="text-2xl sm:text-3xl md:text-4xl font-black uppercase text-black pt-6 pb-2 border-b-3 border-black">
                {renderInlineText(text)}
              </h1>
            )
          }

          // H2 Heading
          if (trimmed.startsWith('## ')) {
            const text = trimmed.slice(3).trim()
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            return (
              <h2 id={id} key={pIdx} className="text-xl sm:text-2xl font-black uppercase text-black pt-5 pb-1 border-b-2 border-black flex items-center gap-2">
                <span className="h-3 w-3 bg-[#FFE600] border border-black inline-block"></span>
                {renderInlineText(text)}
              </h2>
            )
          }

          // H3 Heading
          if (trimmed.startsWith('### ')) {
            const text = trimmed.slice(4).trim()
            const id = text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
            return (
              <h3 id={id} key={pIdx} className="text-lg font-black uppercase text-black pt-3">
                {renderInlineText(text)}
              </h3>
            )
          }

          // Callout Blockquote (supports multi-line > prefixed blocks)
          if (trimmed.startsWith('>')) {
            const quoteLines = trimmed.split('\n').map(l => l.replace(/^>\s?/, '').trim())
            const quoteText = quoteLines.join(' ')
            return (
              <blockquote key={pIdx} className="my-5 border-l-8 border-[#8A2BE2] bg-[#FFE600]/20 border-4 border-black p-4 font-bold text-black shadow-[4px_4px_0_0_#000]">
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
                  <li key={iIdx} className="flex items-start gap-2 font-bold text-zinc-800 text-sm md:text-base">
                    <span className="mt-1 flex h-2 w-2 shrink-0 bg-black rotate-45" />
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
              <ol key={pIdx} className="my-3 space-y-2 pl-4 list-decimal font-bold text-zinc-800 text-sm md:text-base">
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
            <p key={pIdx} className="text-sm md:text-base font-bold text-zinc-800 leading-relaxed">
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
