import type { ReactNode } from 'react'
import { Board, Leaf } from '../components/primitives'

/**
 * Sign-in and sign-up share one page: the promise on the left, Clerk's form on
 * the right laid on a second ply. The page's single H1 lives here.
 */
export function AuthShell({
  titleId,
  title,
  lede,
  aside,
  children,
}: {
  titleId: string
  title: ReactNode
  lede: ReactNode
  aside?: ReactNode
  children: ReactNode
}) {
  return (
    <Board volume="start" first labelledBy={titleId}>
      <Leaf>
        <div className="hb-auth">
          <div className="hb-stack" style={{ '--gap': '1.4rem' } as React.CSSProperties}>
            <h1 id={titleId} className="hb-display hb-display--post">
              {title}
            </h1>
            <p className="hb-lede">{lede}</p>
            {aside}
          </div>
          <div className="hb-ply hb-clerk">{children}</div>
        </div>
      </Leaf>
    </Board>
  )
}
