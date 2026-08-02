import { useContext } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MotionConfigContext } from 'framer-motion'
import { describe, expect, it } from 'vitest'
import { MotionPreferenceProvider, SkipLink } from './SkipLink'

describe('SkipLink', () => {
  it('is the first keyboard stop and targets the shared content container', async () => {
    const user = userEvent.setup()

    render(
      <>
        <SkipLink />
        <button type="button">Next control</button>
        <div id="main-content" tabIndex={-1}>Page content</div>
      </>,
    )

    await user.tab()

    const skipLink = screen.getByRole('link', { name: 'Skip to main content' })
    expect(skipLink).toHaveFocus()
    expect(skipLink).toHaveAttribute('href', '#main-content')
    expect(document.querySelector(skipLink.getAttribute('href')!)).toHaveAttribute('tabindex', '-1')
  })

  it('passes the user reduced-motion preference to Framer Motion descendants', () => {
    function MotionPreferenceProbe() {
      const { reducedMotion } = useContext(MotionConfigContext)
      return <output>{reducedMotion}</output>
    }

    render(
      <MotionPreferenceProvider>
        <MotionPreferenceProbe />
      </MotionPreferenceProvider>,
    )

    expect(screen.getByText('user')).toBeInTheDocument()
  })
})
