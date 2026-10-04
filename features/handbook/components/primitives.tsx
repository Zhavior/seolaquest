import type { ComponentProps, ReactNode } from 'react'
import { boardStyle, type VolumeId } from '../tokens'

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

/**
 * A full-bleed colour divider board. `volume` picks the hue; the solved leaf,
 * edge, and on-board ink arrive as custom properties for everything inside.
 */
export function Board({
  volume,
  first,
  track = true,
  id,
  labelledBy,
  className,
  children,
}: {
  volume: VolumeId
  first?: boolean
  /** Whether scrolling into this board moves the rail's current tab. */
  track?: boolean
  id?: string
  labelledBy?: string
  className?: string
  children: ReactNode
}) {
  return (
    <section
      id={id}
      data-volume={track ? volume : undefined}
      aria-labelledby={labelledBy}
      className={cx('hb-board', first && 'hb-board--first', className)}
      style={boardStyle(volume)}
    >
      {children}
    </section>
  )
}

/** The acetate leaf that carries the words. */
export function Leaf({
  bare,
  className,
  children,
  ...rest
}: { bare?: boolean; className?: string; children: ReactNode } & Omit<ComponentProps<'div'>, 'className' | 'children'>) {
  return (
    <div className={cx('hb-leaf', bare && 'hb-leaf--bare', className)} {...rest}>
      {children}
    </div>
  )
}

/**
 * Manual layout: the chapter head hangs in the margin column, the body runs
 * across four columns. Below 62rem the head stacks above the body.
 */
export function Spread({
  head,
  headId,
  headLevel = 2,
  note,
  children,
}: {
  head: ReactNode
  headId?: string
  /** `'p'` hangs a label in the margin without adding a heading to the outline. */
  headLevel?: 1 | 2 | 'p'
  note?: ReactNode
  children: ReactNode
}) {
  const Heading = headLevel === 1 ? 'h1' : headLevel === 'p' ? 'p' : 'h2'
  return (
    <div className="hb-spread">
      <div className="hb-side">
        <Heading id={headId} className="hb-sidehead">
          {head}
        </Heading>
        {note ? <p className="hb-sidenote">{note}</p> : null}
      </div>
      <div className="hb-main">{children}</div>
    </div>
  )
}

/**
 * A whole non-home page: one board, one leaf, the page's single H1 hanging in
 * the margin. `children` is the body column.
 */
export function HandbookPage({
  volume,
  title,
  note,
  children,
}: {
  volume: VolumeId
  title: ReactNode
  note?: ReactNode
  children: ReactNode
}) {
  return (
    <Board volume={volume} first labelledBy="page-title">
      <Leaf>
        <Spread head={title} headId="page-title" headLevel={1} note={note}>
          {children}
        </Spread>
      </Leaf>
    </Board>
  )
}
