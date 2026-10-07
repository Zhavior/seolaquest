import Link from 'next/link'
import { Board, Leaf, Spread } from '../components/primitives'

type Note = {
  slug: string
  title: string
  description: string
  date: string
  readTimeMinutes: number
}

function formatDate(value: string) {
  const parsed = new Date(`${value}T00:00:00Z`)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'UTC' })
}

export function NotesIndex({ notes }: { notes: Note[] }) {
  return (
    <ol className="hb-notes">
      {notes.map((note) => (
        <li key={note.slug}>
          <p className="hb-mono hb-soft">
            <time dateTime={note.date}>{formatDate(note.date)}</time> · {note.readTimeMinutes} min read
          </p>
          <h3 className="hb-h3">
            <Link href={`/blog/${note.slug}`}>{note.title}</Link>
          </h3>
          <p className="hb-soft">{note.description}</p>
        </li>
      ))}
    </ol>
  )
}

export function NotesChapter({ notes }: { notes: Note[] }) {
  if (notes.length === 0) return null
  return (
    <Board volume="notes" id="notes" labelledBy="notes-title">
      <Leaf>
        <Spread
          head="Field Notes"
          headId="notes-title"
          note="Articles are opinion and orientation, not SEOlaQuest results."
        >
          <div className="hb-stack" style={{ '--gap': '1.75rem' } as React.CSSProperties}>
            <p className="hb-lede">Notes from the hunt.</p>
            <NotesIndex notes={notes} />
            <p>
              <Link href="/blog" className="hb-link">
                All field notes
              </Link>
            </p>
          </div>
        </Spread>
      </Leaf>
    </Board>
  )
}
